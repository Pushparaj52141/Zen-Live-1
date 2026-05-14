/**
 * Manual Testing Script for Refresh Token Implementation
 * 
 * This file contains instructions and test cases to verify the refresh token functionality.
 * Follow these steps in order to ensure everything works correctly.
 */

console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║         REFRESH TOKEN IMPLEMENTATION - TESTING GUIDE                 ║
╚══════════════════════════════════════════════════════════════════════╝

📋 PREREQUISITES:
   ✓ Backend server running on localhost:3000
   ✓ Frontend running on localhost:5173
   ✓ Database connected and tables created
   ✓ Environment variables set correctly in backend/.env

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 1: Login and Verify Cookie Setup
─────────────────────────────────────────────────────────────────────
1. Open browser DevTools (F12)
2. Go to Application tab → Cookies
3. Navigate to http://localhost:5173/login
4. Login with valid credentials
5. After successful login, verify:
   ✓ You're redirected to dashboard
   ✓ In Cookies tab, you see:
     • refreshToken (httpOnly: ✓, Secure: false for dev)
     • Value should be a long JWT string
     • Expires should be ~7 days from now
   ✓ In localStorage, you see:
     • token (access token)
     • user (user object)
     • username
     • profile_image (if available)

Expected Result: ✅ Login successful, cookies set, localStorage populated
Failure: ❌ If no refreshToken cookie, check CORS configuration

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 2: Access Token Validation
─────────────────────────────────────────────────────────────────────
1. After login, open Console tab in DevTools
2. Paste and run:
   \`\`\`javascript
   const token = localStorage.getItem('token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Token expires at:', new Date(payload.exp * 1000));
   console.log('Time until expiry:', 
     Math.round((payload.exp * 1000 - Date.now()) / 1000 / 60), 'minutes');
   \`\`\`

Expected Result: ✅ Should show ~15 minutes until expiry
Failure: ❌ If shows different time, check ACCESS_TOKEN_EXPIRY in .env

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 3: Automatic Token Refresh (Quick Test)
─────────────────────────────────────────────────────────────────────
For faster testing, temporarily change token expiry:

1. Stop backend server
2. Edit backend/.env:
   ACCESS_TOKEN_EXPIRY=1m  (change from 15m to 1m)
3. Restart backend server
4. Login to frontend
5. Open Network tab in DevTools
6. Wait 1 minute (access token expires)
7. Navigate to any page or trigger an API call
8. In Network tab, observe:
   ✓ Original API request fails with 401
   ✓ Automatic call to /auth/refresh-token (Status: 200)
   ✓ Original API request retried (Status: 200)
9. Check Cookies tab:
   ✓ refreshToken cookie updated with new value
10. Check localStorage:
    ✓ token updated with new access token

Expected Result: ✅ Seamless token refresh without user intervention
Failure: ❌ If redirected to login, check refresh token logic in client.js

IMPORTANT: After testing, restore ACCESS_TOKEN_EXPIRY=15m in .env

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 4: Manual Refresh Token Call
─────────────────────────────────────────────────────────────────────
1. After login, open Console in DevTools
2. Run this command:
   \`\`\`javascript
   fetch('http://localhost:3000/auth/refresh-token', {
     method: 'POST',
     credentials: 'include',  // This sends cookies
   })
   .then(r => r.json())
   .then(data => console.log('New token:', data))
   .catch(err => console.error('Error:', err));
   \`\`\`

Expected Result: ✅ Returns new access token
   {
     "token": "new_jwt_token",
     "accessToken": "new_jwt_token",
     "role_id": 1,
     "r_id": 1
   }
Failure: ❌ 401 error means refresh token is invalid or expired

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 5: Refresh Token Expiration (7 Days)
─────────────────────────────────────────────────────────────────────
Note: This test takes 7 days unless you modify REFRESH_TOKEN_EXPIRY

For quick testing:
1. Stop backend
2. Edit backend/.env:
   REFRESH_TOKEN_EXPIRY=2m  (change from 7d to 2m)
3. Restart backend and login
4. Wait 2 minutes
5. Try to make an API call or manually refresh token

Expected Result: ✅ After 2 minutes, refresh fails and user redirected to login
Failure: ❌ If refresh succeeds after expiry, check database for old tokens

IMPORTANT: Restore REFRESH_TOKEN_EXPIRY=7d after testing

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 6: Logout and Cookie Cleanup
─────────────────────────────────────────────────────────────────────
1. After login, verify cookies and localStorage are set
2. Click Logout button
3. Check Application tab → Cookies:
   ✓ refreshToken cookie should be deleted
4. Check localStorage:
   ✓ All auth-related items cleared (token, user, username, profile_image)
5. Verify you're redirected to login page

Expected Result: ✅ All tokens cleared, redirected to login
Failure: ❌ If cookie persists, check logout endpoint in authController.js

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 7: Multiple Browser Tabs
─────────────────────────────────────────────────────────────────────
1. Login in Tab 1
2. Open Tab 2 with same app URL
3. In Tab 1, trigger an API call
4. In Tab 2, trigger an API call
5. Both should work with same cookies

Expected Result: ✅ Both tabs share cookies, both authenticated
Failure: ❌ If one tab fails, check cookie scope (path, domain)

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 8: Database Verification
─────────────────────────────────────────────────────────────────────
Check refresh tokens in database:

1. Connect to PostgreSQL database
2. Run query:
   \`\`\`sql
   SELECT 
     id,
     user_id,
     LEFT(token_hash, 20) as token_hash_preview,
     expires_at,
     created_at
   FROM refresh_tokens
   ORDER BY created_at DESC
   LIMIT 5;
   \`\`\`

Expected Result: ✅ Should see token records with:
   • Unique token_hash values
   • expires_at ~7 days in future
   • created_at = recent timestamp

3. After logout, run query again:
   Expected: ✅ Token for logged out user should be deleted

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 9: Security Verification
─────────────────────────────────────────────────────────────────────
Verify cookies are secure:

1. After login, in DevTools Console:
   \`\`\`javascript
   // This should return null (httpOnly prevents JS access)
   console.log('Can read refresh token?', 
     document.cookie.includes('refreshToken'));
   \`\`\`

Expected Result: ✅ Returns false (cookie is httpOnly)
Failure: ❌ If true, refresh token is NOT httpOnly (security issue!)

2. Check cookie flags in Application → Cookies:
   • HttpOnly: ✓
   • Secure: false (dev), true (production)
   • SameSite: Lax (dev), None (production)

═══════════════════════════════════════════════════════════════════════

📝 TEST CASE 10: Production Simulation
─────────────────────────────────────────────────────────────────────
1. Stop backend
2. Edit backend/.env:
   NODE_ENV=production
3. Restart backend
4. Verify in cookies:
   • Secure flag: ✓
   • SameSite: None
5. You'll need HTTPS in production for this to work

Expected Result: ✅ Secure flag enabled in production mode
Note: Local dev will fail with Secure flag unless using HTTPS

═══════════════════════════════════════════════════════════════════════

🐛 COMMON ISSUES AND SOLUTIONS:

Issue: "No refreshToken cookie after login"
Solution: 
  • Check CORS credentials: true in backend
  • Verify withCredentials: true in axios
  • Check cookie domain matches frontend

Issue: "Refresh token always fails with 401"
Solution:
  • Check refreshToken exists in cookies
  • Verify token not expired in database
  • Check database connection
  • Ensure refresh endpoint doesn't require access token

Issue: "Infinite redirect loop to /login"
Solution:
  • Check _retry flag is set properly
  • Verify refresh endpoint has skipAuthRefresh: true
  • Check that refresh returns valid token

Issue: "Cookie not sent with API requests"
Solution:
  • Ensure withCredentials: true in axios config
  • Verify cookie path is "/" 
  • Check SameSite attribute compatibility

═══════════════════════════════════════════════════════════════════════

✅ COMPLETION CHECKLIST:

Before marking implementation as complete:
□ All 10 test cases pass
□ Cookies are httpOnly in production
□ Access token expires in 15 minutes
□ Refresh token expires in 7 days
□ Automatic refresh works seamlessly
□ Logout clears all tokens
□ Database stores hashed tokens
□ CORS properly configured
□ No console errors during token refresh
□ Documentation is complete

═══════════════════════════════════════════════════════════════════════

📚 REFERENCE FILES:
   • Backend: backend/src/controllers/auth/authController.js
   • Frontend API Client: Frontend/src/shared/api/client.js
   • Auth Slice: Frontend/src/features/auth/store/authSlice.js
   • JWT Service: backend/src/services/jwtService.js
   • Refresh Token Service: backend/src/services/refreshTokenService.js
   • Environment Config: backend/.env
   • Full Documentation: REFRESH_TOKEN_IMPLEMENTATION.md

═══════════════════════════════════════════════════════════════════════
`);

module.exports = {
    description: 'Testing guide for refresh token implementation',
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
};
