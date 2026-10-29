import crypto from 'crypto';

class PiggiAPI {
  constructor(phoneNumber, password, deviceId, firebaseToken = null) {
    this.phoneNumber = phoneNumber;
    this.password = password;
    this.deviceId = deviceId;
    this.token = null;
    this.baseURL = 'https://api.piggi.vn';
    
    // Firebase App Check token (can be passed or use default)
    this.firebaseToken = firebaseToken || 'eyJraWQiOiJrMnhhbUEiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxOjUxODY1MjAzNjUyODppb3M6MDNlMjk0ODZhZjZlM2Y2NTdmYzI3NSIsImF1ZCI6WyJwcm9qZWN0cy81MTg2NTIwMzY1MjgiLCJwcm9qZWN0cy9ub3RpLTYwNzFkIl0sInByb3ZpZGVyIjoiZGVidWciLCJpc3MiOiJodHRwczovL2ZpcmViYXNlYXBwY2hlY2suZ29vZ2xlYXBpcy5jb20vNTE4NjUyMDM2NTI4IiwiZXhwIjoxNzg3MTI0MjE1LCJpYXQiOjE3ODcxMjA2MTUsImp0aSI6IlV2cWNsUXo0dGR3aDExVmdrdW5BaXZMbDR5WGxaNk96cndmUzQ4YTNHbzgifQ.EQQrJ2b7QF0O49TYIMpwVA2hB7lFjXaQcyboIKA3jXZMjgF9Idt7x4hZgGRRa6vG3-Z57XEoGYpIeznjPhpbYlTaklJ5vlYIEpHXy0pz6-JZcH_5vqCeyUSu2K7eWRDhz5j4pSXc3XuuVfqmRdyzuWg2wak09AqYX6GiSvEb2gc6utW31jG8ZB6xr89vXbw15wB_N0h_J_NSg5KJXXWOnpNH7iifB37ksXp3waGUfh_GWeVV6RRTov2F3Ln1Btop5lNxrC2J7h1k5pORUgxypdiRJUBLil--G4f1S_fKwHs_COQuuXXpol5HGCgtbAuhKnt8j3fa8P5Lhw1dlSMAhMnU5R7gxEsjUtPO3PiRA_4k8PC4KhScPh37bRkI9a3AoiWpSUW2RjsLdMYr8ZZ1u8qRCZazGOpI-tHXWmqBDluuB3CEivxJwpZefjmewXv-IVD5PoqrlGpEJpoGQROGttVb_pnjoCYVhhSYUHN-iBgG20PiGGi26IVa8DPyzJN6';
  }

  // Generate x-vfy hash (cần reverse engineer logic chính xác)
  generateVfy(body, txid) {
    // Đây là placeholder - cần phân tích logic thực tế từ app
    const data = JSON.stringify(body) + txid + this.deviceId;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Common headers for API requests
  getHeaders(includeAuth = false, isCheckIn = false, isGoogleLogin = false) {
    const txid = Date.now();
    const headers = {
      'accept': 'application/json, text/plain, */*',
      'user-agent': 'noti.piggi.vn/4.2.2 (3)',
      'x-device-id': this.deviceId,
      'x-cloudflare-ia': this.firebaseToken,
      'x-color-scheme': 'light',
      'x-txid': txid.toString(),
      'content-type': 'application/json',
      'cookie': `_did=${this.deviceId}`
    };

    // Add iOS-specific headers for Google Login to pass INVALID_PLATFORM check
    if (isGoogleLogin) {
      headers['x-system-version'] = '18.7.2';
      headers['x-device-name'] = 'iPhone';
      headers['x-device-model'] = 'iPhone 12 Pro';
      headers['x-os'] = 'ios';
      headers['accept-language'] = 'vi-VN,vi;q=0.9';
      headers['accept-encoding'] = 'gzip, deflate, br';
    }

    if (isCheckIn) {
      headers['target-apps'] = 'noti';
      headers['app-version'] = '4.2.2 (3)';
    }

    if (includeAuth && this.token) {
      headers['authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // GraphQL headers
  getGraphQLHeaders() {
    const headers = this.getHeaders(true);
    headers['accept'] = 'application/graphql-response+json,application/json;q=0.9';
    return headers;
  }

  // Login to get token
  async login() {
    try {
      const body = {
        phoneNumber: this.phoneNumber,
        password: this.password,
        deviceId: this.deviceId
      };

      const headers = this.getHeaders(false, true);
      const txid = headers['x-txid'];
      headers['x-vfy'] = this.generateVfy(body, txid);

      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.data && data.data.token) {
        this.token = data.data.token;
        console.log('✅ Login successful!');
        return { success: true, token: this.token, userId: data.data.id };
      } else {
        console.error('❌ Login failed:', data);
        return { success: false, error: data.message || 'Unknown error' };
      }
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Login with Google ID Token
  async loginWithGoogle(googleIdToken) {
    try {
      const body = {
        token: googleIdToken,
        deviceId: this.deviceId
      };

      const headers = this.getHeaders(false, false, true); // Pass true for isGoogleLogin
      const txid = headers['x-txid'];
      headers['x-vfy'] = this.generateVfy(body, txid);

      const response = await fetch(`${this.baseURL}/api/auth/login/google`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.data && data.data.token) {
        this.token = data.data.token;
        console.log('✅ Google Login successful!');
        return { 
          success: true, 
          token: this.token, 
          userId: data.data.id,
          email: data.data.email || null,
          isNewUser: data.data.isNewUser || false
        };
      } else {
        console.error('❌ Google Login failed:', data);
        return { success: false, error: data.message || 'Unknown error' };
      }
    } catch (error) {
      console.error('❌ Google Login error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Check-in
  async checkIn() {
    if (!this.token) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const body = {};
      const headers = this.getHeaders(true, true);
      const txid = headers['x-txid'];
      headers['x-vfy'] = this.generateVfy(body, txid);

      const response = await fetch(`${this.baseURL}/api/check-in`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Check-in successful!');
        return { success: true, data };
      } else {
        console.error('❌ Check-in failed:', data);
        return { success: false, error: data.message || 'Check-in failed' };
      }
    } catch (error) {
      console.error('❌ Check-in error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get user info (Me query)
  async getMe() {
    if (!this.token) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const query = {
        operationName: 'MeForHome',
        variables: {},
        extensions: {
          clientLibrary: {
            name: '@apollo/client',
            version: '4.2.6'
          }
        },
        query: `
          fragment MeCoreFields on User {
            id
            completedOnboarding
            phone
            hasPassword
            __typename
          }

          fragment MeHomeFields on User {
            name
            avatar
            email
            appleEmail
            currentCoin
            pendingCoin
            accumulatedCoin
            currentCheckIn
            eligibleForNewUserChallenge
            completedNewUserChallenge
            __typename
          }

          fragment MeRankFields on Rank {
            name
            image
            targetPointNextRank
            resetRankDate
            benefitDescription
            color
            __typename
          }

          query MeForHome {
            me {
              ...MeCoreFields
              ...MeHomeFields
              rank {
                ...MeRankFields
                __typename
              }
              __typename
            }
          }
        `
      };

      const response = await fetch(`${this.baseURL}/graphql/MeForHome`, {
        method: 'POST',
        headers: this.getGraphQLHeaders(),
        body: JSON.stringify(query)
      });

      const data = await response.json();

      if (data.data && data.data.me) {
        const user = data.data.me;
        console.log('✅ User info fetched successfully!');
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            appleEmail: user.appleEmail,
            currentCoin: user.currentCoin,
            pendingCoin: user.pendingCoin,
            accumulatedCoin: user.accumulatedCoin,
            currentCheckIn: user.currentCheckIn,
            rank: user.rank
          }
        };
      } else {
        console.error('❌ Failed to fetch user info:', data);
        return { success: false, error: 'Failed to fetch user info' };
      }
    } catch (error) {
      console.error('❌ Get user info error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Auto check-in and get user info
  async autoCheckIn() {
    console.log('\n🤖 Starting auto check-in process...');
    console.log(`⏰ Time: ${new Date().toLocaleString('vi-VN')}`);

    // Step 1: Check-in
    const checkInResult = await this.checkIn();
    
    if (!checkInResult.success) {
      console.log('⚠️ Check-in failed, but continuing to fetch user info...');
    }

    // Step 2: Get user info
    const userResult = await this.getMe();

    return {
      checkIn: checkInResult,
      user: userResult,
      timestamp: new Date().toISOString()
    };
  }
}

export default PiggiAPI;
