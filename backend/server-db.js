import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { accountQueries, checkinQueries } from './db/db.js';
import checkinService from './services/checkin-service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve React production build or old frontend
const reactBuildPath = path.join(__dirname, '../frontend-react/dist');
const oldFrontendPath = path.join(__dirname, '../frontend');

app.use(express.static(reactBuildPath));
app.use(express.static(oldFrontendPath));

// Shape an account for the browser: never expose credentials or tokens.
function toPublicAccount(acc) {
  return {
    id: acc.id,
    phoneNumber: acc.phone_number,
    deviceId: acc.device_id,
    cronSchedule: acc.cron_schedule,
    isActive: acc.is_active,
    userName: acc.user_name,
    email: acc.email,
    currentCoin: acc.current_coin,
    pendingCoin: acc.pending_coin,
    accumulatedCoin: acc.accumulated_coin,
    currentCheckin: acc.current_checkin,
    rankName: acc.rank_name,
    lastCheckinAt: acc.last_checkin_at,
    createdAt: acc.created_at
  };
}

// ============================================
// AUTH API
// ============================================

// Login with Google
app.post('/api/auth/google', async (req, res) => {
  try {
    const { googleIdToken, deviceId, cronSchedule, firebaseToken } = req.body;

    if (!googleIdToken || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'googleIdToken and deviceId are required'
      });
    }

    // Create temporary API instance to login with Google
    const { default: PiggiAPI } = await import('./piggi-api.js');
    const tempAPI = new PiggiAPI('', '', deviceId, firebaseToken);
    
    const loginResult = await tempAPI.loginWithGoogle(googleIdToken);

    if (!loginResult.success) {
      return res.status(400).json({
        success: false,
        error: loginResult.error
      });
    }

    // Get user info to extract phone/email
    const userResult = await tempAPI.getMe();
    
    if (!userResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to get user info after login'
      });
    }

    const user = userResult.user;

    // Check if account already exists
    // Priority: phone > device_id (to handle Google accounts without phone)
    let existingAccount = null;
    const allAccounts = await accountQueries.getAllActive();
    
    if (user.phone) {
      // Match by phone if available
      existingAccount = allAccounts.find(acc => acc.phone_number === user.phone);
    } else {
      // For Google accounts without phone, match by device_id
      existingAccount = allAccounts.find(acc => acc.device_id === deviceId && !acc.phone_number);
    }

    if (existingAccount) {
      // Update existing account
      const updatedAccount = await accountQueries.update(existingAccount.id, {
        jwtToken: loginResult.token,
        deviceId: deviceId,
        firebaseToken: firebaseToken,
        userName: user.name,
        email: loginResult.email || user.email,
        currentCoin: user.currentCoin,
        pendingCoin: user.pendingCoin,
        accumulatedCoin: user.accumulatedCoin,
        currentCheckin: user.currentCheckIn,
        rankName: user.rank?.name
      });

      // The form offers a run time, so an update should honor it too.
      if (cronSchedule) {
        await accountQueries.updateCronSchedule(
          existingAccount.id,
          cronSchedule
        );
      }

      // The refreshed token has to reach the cron worker too.
      await setupCronJobs();

      return res.json({
        success: true,
        message: 'Account updated successfully',
        account: {
          id: updatedAccount.id,
          phoneNumber: updatedAccount.phone_number,
          userName: user.name,
          isNewUser: false
        }
      });
    } else {
      // Create new account
      const newAccount = await accountQueries.create({
        phoneNumber: user.phone,
        password: '', // No password for Google login
        deviceId: deviceId,
        jwtToken: loginResult.token,
        cronSchedule: cronSchedule || '0 6 * * *',
        firebaseToken: firebaseToken,
        userName: user.name,
        email: loginResult.email || user.email,
        currentCoin: user.currentCoin,
        pendingCoin: user.pendingCoin,
        accumulatedCoin: user.accumulatedCoin,
        currentCheckin: user.currentCheckIn,
        rankName: user.rank?.name
      });

      // Restart cron jobs
      await setupCronJobs();

      return res.json({
        success: true,
        message: 'Account created successfully',
        account: {
          id: newAccount.id,
          phoneNumber: newAccount.phone_number,
          userName: user.name,
          isNewUser: true
        }
      });
    }
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ACCOUNTS API
// ============================================

// Get all accounts
app.get('/api/accounts', async (req, res) => {
  try {
    // Paused accounts stay in the list so they can be resumed.
    const accounts = await accountQueries.getAll();

    res.json({ success: true, accounts: accounts.map(toPublicAccount) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get account by ID
app.get('/api/accounts/:id', async (req, res) => {
  try {
    const account = await accountQueries.getById(parseInt(req.params.id));
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    // Don't send password
    delete account.password;
    delete account.jwt_token;
    
    res.json({ success: true, account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new account
app.post('/api/accounts', async (req, res) => {
  try {
    const { phoneNumber, password, deviceId, cronSchedule, firebaseToken } = req.body;

    if (!phoneNumber || !password || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'phoneNumber, password, and deviceId are required'
      });
    }

    const account = await accountQueries.create({
      phoneNumber,
      password,
      deviceId,
      cronSchedule: cronSchedule || '0 6 * * *',
      firebaseToken
    });

    // A new account must enter the cron schedule without a server restart.
    await setupCronJobs();

    res.json({ success: true, account: toPublicAccount(account) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update account cron schedule
app.patch('/api/accounts/:id/schedule', async (req, res) => {
  try {
    const { cronSchedule } = req.body;
    
    if (!cronSchedule) {
      return res.status(400).json({ success: false, error: 'cronSchedule is required' });
    }

    const account = await accountQueries.updateCronSchedule(
      parseInt(req.params.id),
      cronSchedule
    );

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    // Restart cron jobs
    await setupCronJobs();

    res.json({ success: true, account: toPublicAccount(account) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle account active status
app.patch('/api/accounts/:id/toggle', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const account = await accountQueries.toggleActive(
      parseInt(req.params.id),
      isActive
    );

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    // Resuming an account has to put it back on the cron schedule.
    await setupCronJobs();

    res.json({ success: true, account: toPublicAccount(account) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete account
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const account = await accountQueries.delete(parseInt(req.params.id));
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    // Clear cached API instance
    checkinService.clearAPIInstance(account.id);

    // Drop the deleted account's schedule.
    await setupCronJobs();

    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CHECK-IN API
// ============================================

// Check-in for specific account
app.post('/api/checkin/:id', async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const result = await checkinService.checkin(accountId, false);
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check-in all active accounts
app.post('/api/checkin', async (req, res) => {
  try {
    const results = await checkinService.checkinAll(false);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user info for specific account
app.get('/api/user/:id', async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const result = await checkinService.getUserInfo(accountId);
    
    if (result.success) {
      res.json({ success: true, user: result.user });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// HISTORY API
// ============================================

// Get history for specific account
app.get('/api/history/:id', async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 30;
    
    const history = await checkinQueries.getByAccount(accountId, limit);
    
    res.json({ success: true, history, total: history.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all history
app.get('/api/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = await checkinQueries.getAll(limit);
    
    res.json({ success: true, history, total: history.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// LEGACY API (backward compatibility)
// ============================================

// Get status (first account)
app.get('/api/status', async (req, res) => {
  try {
    const accounts = await accountQueries.getAllActive();
    const firstAccount = accounts[0];

    if (!firstAccount) {
      return res.json({
        status: 'running',
        message: 'No accounts configured'
      });
    }

    const history = await checkinQueries.getByAccount(firstAccount.id, 1);
    
    res.json({
      status: 'running',
      phoneNumber: firstAccount.phone_number?.replace(/(\d{2})(\d+)(\d{3})/, '$1***$3'),
      deviceId: firstAccount.device_id,
      lastCheckIn: history[0] || null,
      lastUserInfo: {
        name: firstAccount.user_name,
        phone: firstAccount.phone_number,
        currentCoin: firstAccount.current_coin,
        pendingCoin: firstAccount.pending_coin,
        accumulatedCoin: firstAccount.accumulated_coin,
        currentCheckIn: firstAccount.current_checkin,
        rank: { name: firstAccount.rank_name }
      },
      totalAccounts: accounts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user info (first account)
app.get('/api/user', async (req, res) => {
  try {
    const accounts = await accountQueries.getAllActive();
    if (accounts.length === 0) {
      return res.status(404).json({ success: false, error: 'No accounts found' });
    }

    const result = await checkinService.getUserInfo(accounts[0].id);
    
    if (result.success) {
      res.json({ success: true, user: result.user });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CRON JOBS
// ============================================

let cronJobs = [];

async function setupCronJobs() {
  // Clear existing cron jobs
  cronJobs.forEach(job => job.stop());
  cronJobs = [];

  // Get all active accounts
  const accounts = await accountQueries.getAllActive();
  
  if (accounts.length === 0) {
    console.log('⚠️  No active accounts found for cron scheduling');
    return;
  }

  // Group accounts by cron schedule
  const scheduleMap = new Map();
  
  accounts.forEach(account => {
    const schedule = account.cron_schedule || '0 6 * * *';
    if (!scheduleMap.has(schedule)) {
      scheduleMap.set(schedule, []);
    }
    scheduleMap.get(schedule).push(account);
  });

  // Create cron job for each unique schedule
  scheduleMap.forEach((accountsGroup, schedule) => {
    const job = cron.schedule(schedule, async () => {
      console.log(`\n⏰ Scheduled check-in triggered! (${schedule})`);
      console.log(`📱 Accounts: ${accountsGroup.map(a => a.phone_number).join(', ')}`);
      
      for (const account of accountsGroup) {
        try {
          await checkinService.checkin(account.id, true);
        } catch (error) {
          console.error(`❌ Failed to check-in ${account.phone_number}:`, error.message);
        }
      }
    }, {
      timezone: 'Asia/Ho_Chi_Minh'
    });

    cronJobs.push(job);
    console.log(`⏰ Cron job scheduled: ${schedule} for ${accountsGroup.length} account(s)`);
  });
}

// Catch-all route for React Router (SPA)
app.get('*', (req, res) => {
  const reactIndexPath = path.join(__dirname, '../frontend-react/dist/index.html');
  const oldIndexPath = path.join(__dirname, '../frontend/index.html');
  
  res.sendFile(reactIndexPath, (err) => {
    if (err) {
      res.sendFile(oldIndexPath);
    }
  });
});

// Start server
app.listen(PORT, async () => {
  console.log('\n🚀 Piggi Auto Check-in Server Started (Database Mode)!');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🗄️  Database: PostgreSQL (Supabase)`);
  
  try {
    // Load accounts from database
    const accounts = await accountQueries.getAllActive();
    console.log(`\n📱 Active accounts: ${accounts.length}`);
    
    accounts.forEach(acc => {
      console.log(`   [${acc.id}] ${acc.phone_number} - ${acc.cron_schedule}`);
    });

    // Setup cron jobs
    console.log('');
    await setupCronJobs();
    
    console.log(`\n🌐 Open browser: http://localhost:${PORT}\n`);

    // Initial login for all accounts
    console.log('🔐 Testing login for all accounts...');
    for (const account of accounts) {
      try {
        await checkinService.login(account.id);
      } catch (error) {
        console.error(`❌ Failed to login ${account.phone_number}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
  }
});
