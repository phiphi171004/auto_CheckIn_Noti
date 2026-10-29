import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Parse Supabase connection string
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  // Store timestamps in Vietnam timezone
  options: '-c timezone=Asia/Ho_Chi_Minh'
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// Account queries
export const accountQueries = {
  // Get all active accounts
  getAllActive: async () => {
    const result = await pool.query(
      'SELECT * FROM accounts WHERE is_active = true ORDER BY id'
    );
    return result.rows;
  },

  // Get every account, including paused ones (for the management screen)
  getAll: async () => {
    const result = await pool.query(
      'SELECT * FROM accounts ORDER BY id'
    );
    return result.rows;
  },

  // Get account by phone
  getByPhone: async (phoneNumber) => {
    const result = await pool.query(
      'SELECT * FROM accounts WHERE phone_number = $1',
      [phoneNumber]
    );
    return result.rows[0];
  },

  // Get account by ID
  getById: async (id) => {
    const result = await pool.query(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Create new account
  create: async (data) => {
    const {
      phoneNumber,
      password,
      deviceId,
      jwtToken = null,
      cronSchedule = '0 6 * * *',
      firebaseToken = null,
      userName = null,
      email = null,
      currentCoin = null,
      pendingCoin = null,
      accumulatedCoin = null,
      currentCheckin = null,
      rankName = null
    } = data;

    // Use NULL instead of empty string for phone_number if not provided
    const phone = phoneNumber || null;

    const result = await pool.query(
      `INSERT INTO accounts 
       (phone_number, password, device_id, jwt_token, cron_schedule, firebase_token, 
        user_name, email, current_coin, pending_coin, accumulated_coin, current_checkin, rank_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [phone, password, deviceId, jwtToken, cronSchedule, firebaseToken,
       userName, email, currentCoin, pendingCoin, accumulatedCoin, currentCheckin, rankName]
    );
    return result.rows[0];
  },

  // Update account (for Google login updates)
  update: async (id, data) => {
    const {
      jwtToken = null,
      deviceId = null,
      firebaseToken = null,
      userName = null,
      email = null,
      currentCoin = null,
      pendingCoin = null,
      accumulatedCoin = null,
      currentCheckin = null,
      rankName = null
    } = data;

    const result = await pool.query(
      `UPDATE accounts 
       SET jwt_token = COALESCE($1, jwt_token),
           device_id = COALESCE($2, device_id),
           firebase_token = COALESCE($3, firebase_token),
           user_name = COALESCE($4, user_name),
           email = COALESCE($5, email),
           current_coin = COALESCE($6, current_coin),
           pending_coin = COALESCE($7, pending_coin),
           accumulated_coin = COALESCE($8, accumulated_coin),
           current_checkin = COALESCE($9, current_checkin),
           rank_name = COALESCE($10, rank_name),
           last_login_at = TIMEZONE('Asia/Ho_Chi_Minh', NOW()),
           updated_at = TIMEZONE('Asia/Ho_Chi_Minh', NOW())
       WHERE id = $11 
       RETURNING *`,
      [jwtToken, deviceId, firebaseToken, userName, email, currentCoin, pendingCoin, 
       accumulatedCoin, currentCheckin, rankName, id]
    );
    return result.rows[0];
  },

  // Update JWT token after login
  updateToken: async (id, jwtToken) => {
    const result = await pool.query(
      `UPDATE accounts 
       SET jwt_token = $1, last_login_at = TIMEZONE('Asia/Ho_Chi_Minh', NOW()) 
       WHERE id = $2 
       RETURNING *`,
      [jwtToken, id]
    );
    return result.rows[0];
  },

  // Update user info from API
  updateUserInfo: async (id, userInfo) => {
    const {
      userId,
      name,
      currentCoin,
      pendingCoin,
      accumulatedCoin,
      currentCheckIn,
      rankName
    } = userInfo;

    const result = await pool.query(
      `UPDATE accounts 
       SET user_id = $1, 
           user_name = $2, 
           current_coin = $3, 
           pending_coin = $4, 
           accumulated_coin = $5, 
           current_checkin = $6, 
           rank_name = $7,
           updated_at = TIMEZONE('Asia/Ho_Chi_Minh', NOW())
       WHERE id = $8 
       RETURNING *`,
      [userId, name, currentCoin, pendingCoin, accumulatedCoin, currentCheckIn, rankName, id]
    );
    return result.rows[0];
  },

  // Update last check-in time
  updateLastCheckin: async (id) => {
    const result = await pool.query(
      `UPDATE accounts 
       SET last_checkin_at = TIMEZONE('Asia/Ho_Chi_Minh', NOW()) 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  // Update cron schedule
  updateCronSchedule: async (id, cronSchedule) => {
    const result = await pool.query(
      `UPDATE accounts 
       SET cron_schedule = $1 
       WHERE id = $2 
       RETURNING *`,
      [cronSchedule, id]
    );
    return result.rows[0];
  },

  // Toggle account active status
  toggleActive: async (id, isActive) => {
    const result = await pool.query(
      `UPDATE accounts 
       SET is_active = $1 
       WHERE id = $2 
       RETURNING *`,
      [isActive, id]
    );
    return result.rows[0];
  },

  // Delete account
  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM accounts WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};

// Check-in history queries
export const checkinQueries = {
  // Create check-in record
  create: async (data) => {
    const {
      accountId,
      success,
      errorMessage = null,
      coinBefore = null,
      coinAfter = null,
      checkinStreak = null,
      isScheduled = false
    } = data;

    const result = await pool.query(
      `INSERT INTO checkin_history 
       (account_id, success, error_message, coin_before, coin_after, checkin_streak, is_scheduled, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, TIMEZONE('Asia/Ho_Chi_Minh', NOW())) 
       RETURNING *`,
      [accountId, success, errorMessage, coinBefore, coinAfter, checkinStreak, isScheduled]
    );
    return result.rows[0];
  },

  // Get history by account
  getByAccount: async (accountId, limit = 30) => {
    const result = await pool.query(
      `SELECT * FROM checkin_history 
       WHERE account_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [accountId, limit]
    );
    return result.rows;
  },

  // Get all history
  getAll: async (limit = 100) => {
    const result = await pool.query(
      `SELECT ch.*, a.phone_number, a.user_name, a.email 
       FROM checkin_history ch 
       JOIN accounts a ON ch.account_id = a.id 
       ORDER BY ch.created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  // Get today's check-ins
  getTodayByAccount: async (accountId) => {
    const result = await pool.query(
      `SELECT * FROM checkin_history 
       WHERE account_id = $1 
       AND DATE(created_at) = CURRENT_DATE 
       ORDER BY created_at DESC`,
      [accountId]
    );
    return result.rows;
  }
};

// API logs queries
export const apiLogQueries = {
  // Create log
  create: async (data) => {
    const {
      accountId,
      endpoint,
      method,
      statusCode = null,
      responseTime = null,
      error = null
    } = data;

    const result = await pool.query(
      `INSERT INTO api_logs 
       (account_id, endpoint, method, status_code, response_time, error, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, TIMEZONE('Asia/Ho_Chi_Minh', NOW())) 
       RETURNING *`,
      [accountId, endpoint, method, statusCode, responseTime, error]
    );
    return result.rows[0];
  },

  // Get logs by account
  getByAccount: async (accountId, limit = 50) => {
    const result = await pool.query(
      `SELECT * FROM api_logs 
       WHERE account_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [accountId, limit]
    );
    return result.rows;
  }
};

export default pool;
