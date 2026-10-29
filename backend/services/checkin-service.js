import PiggiAPI from '../piggi-api.js';
import { accountQueries, checkinQueries, apiLogQueries } from '../db/db.js';

class CheckinService {
  constructor() {
    this.apiInstances = new Map(); // Cache API instances per account
  }

  // Get or create API instance for account
  getAPIInstance(account) {
    const key = account.id;
    
    if (!this.apiInstances.has(key)) {
      const api = new PiggiAPI(
        account.phone_number,
        account.password,
        account.device_id,
        account.firebase_token
      );
      
      // Set JWT token if exists
      if (account.jwt_token) {
        api.token = account.jwt_token;
      }
      
      this.apiInstances.set(key, api);
    }
    
    return this.apiInstances.get(key);
  }

  // Clear cached API instance
  clearAPIInstance(accountId) {
    this.apiInstances.delete(accountId);
  }

  // Login account
  async login(accountId) {
    const account = await accountQueries.getById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Skip login if account has no password (Google login) but has JWT token
    if (!account.password && account.jwt_token) {
      console.log(`⏭️  Skipping login for ${account.phone_number || account.user_name} (already has JWT token from Google login)`);
      return { success: true, token: account.jwt_token, skipped: true };
    }

    // Skip login if account has no password and no JWT token (invalid state)
    if (!account.password) {
      console.error(`❌ Login failed for ${account.phone_number || account.user_name}: No password and no JWT token`);
      return { success: false, error: 'No password configured' };
    }

    const api = this.getAPIInstance(account);
    const startTime = Date.now();

    try {
      const result = await api.login();
      const responseTime = Date.now() - startTime;

      // Log API call
      await apiLogQueries.create({
        accountId: account.id,
        endpoint: '/api/auth/login',
        method: 'POST',
        statusCode: result.success ? 201 : 400,
        responseTime
      });

      if (result.success) {
        // Update JWT token in database
        await accountQueries.updateToken(account.id, result.token);
        console.log(`✅ Login successful for ${account.phone_number}`);
      } else {
        console.error(`❌ Login failed for ${account.phone_number}:`, result.error);
      }

      return result;
    } catch (error) {
      await apiLogQueries.create({
        accountId: account.id,
        endpoint: '/api/auth/login',
        method: 'POST',
        error: error.message
      });
      throw error;
    }
  }

  // Get user info
  async getUserInfo(accountId) {
    const account = await accountQueries.getById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const api = this.getAPIInstance(account);
    const startTime = Date.now();

    try {
      const result = await api.getMe();
      const responseTime = Date.now() - startTime;

      await apiLogQueries.create({
        accountId: account.id,
        endpoint: '/graphql/MeForHome',
        method: 'POST',
        statusCode: result.success ? 200 : 400,
        responseTime
      });

      if (result.success) {
        // Update user info in database
        await accountQueries.updateUserInfo(account.id, {
          userId: result.user.id,
          name: result.user.name,
          currentCoin: result.user.currentCoin,
          pendingCoin: result.user.pendingCoin,
          accumulatedCoin: result.user.accumulatedCoin,
          currentCheckIn: result.user.currentCheckIn,
          rankName: result.user.rank?.name
        });

        // Also update email if available
        if (result.user.email) {
          await accountQueries.update(account.id, {
            email: result.user.email
          });
        }
      }

      return result;
    } catch (error) {
      await apiLogQueries.create({
        accountId: account.id,
        endpoint: '/graphql/MeForHome',
        method: 'POST',
        error: error.message
      });
      throw error;
    }
  }

  // Check-in for account
  async checkin(accountId, isScheduled = false) {
    const account = await accountQueries.getById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (!account.is_active) {
      console.log(`⚠️  Account ${account.phone_number} is inactive, skipping check-in`);
      return { success: false, error: 'Account is inactive' };
    }

    console.log(`\n🎯 Check-in for ${account.phone_number}...`);
    
    const api = this.getAPIInstance(account);
    const startTime = Date.now();

    try {
      // Get current coin before check-in
      const userInfoBefore = await this.getUserInfo(accountId);
      const coinBefore = userInfoBefore.success ? userInfoBefore.user.currentCoin : null;
      const streakBefore = userInfoBefore.success ? userInfoBefore.user.currentCheckIn : null;

      // Perform check-in
      const result = await api.checkIn();
      const responseTime = Date.now() - startTime;

      await apiLogQueries.create({
        accountId: account.id,
        endpoint: '/api/check-in',
        method: 'POST',
        statusCode: result.success ? 200 : 400,
        responseTime
      });

      // Get coin after check-in
      const userInfoAfter = await this.getUserInfo(accountId);
      const coinAfter = userInfoAfter.success ? userInfoAfter.user.currentCoin : null;
      const streakAfter = userInfoAfter.success ? userInfoAfter.user.currentCheckIn : null;

      // Save check-in history
      await checkinQueries.create({
        accountId: account.id,
        success: result.success,
        errorMessage: result.error || null,
        coinBefore,
        coinAfter,
        checkinStreak: streakAfter,
        isScheduled
      });

      if (result.success) {
        await accountQueries.updateLastCheckin(account.id);
        console.log(`✅ Check-in successful! Coin: ${coinBefore} → ${coinAfter}, Streak: ${streakAfter} days`);
      } else {
        console.log(`❌ Check-in failed: ${result.error}`);
      }

      return {
        ...result,
        coinBefore,
        coinAfter,
        streakAfter
      };

    } catch (error) {
      console.error(`❌ Check-in error:`, error.message);
      
      await apiLogQueries.create({
        accountId: account.id,
        endpoint: '/api/check-in',
        method: 'POST',
        error: error.message
      });

      await checkinQueries.create({
        accountId: account.id,
        success: false,
        errorMessage: error.message,
        isScheduled
      });

      throw error;
    }
  }

  // Check-in all active accounts
  async checkinAll(isScheduled = false) {
    console.log('\n🤖 Starting check-in for all active accounts...');
    console.log(`⏰ Time: ${new Date().toLocaleString('vi-VN')}`);

    const accounts = await accountQueries.getAllActive();
    
    if (accounts.length === 0) {
      console.log('⚠️  No active accounts found');
      return [];
    }

    console.log(`📱 Found ${accounts.length} active account(s)`);

    const results = [];

    for (const account of accounts) {
      try {
        const result = await this.checkin(account.id, isScheduled);
        results.push({
          accountId: account.id,
          phoneNumber: account.phone_number,
          ...result
        });
      } catch (error) {
        console.error(`❌ Failed to check-in ${account.phone_number}:`, error.message);
        results.push({
          accountId: account.id,
          phoneNumber: account.phone_number,
          success: false,
          error: error.message
        });
      }
    }

    console.log('\n📊 Check-in Summary:');
    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`   ${status} ${r.phoneNumber}: ${r.success ? 'Success' : r.error}`);
    });

    return results;
  }
}

export default new CheckinService();
