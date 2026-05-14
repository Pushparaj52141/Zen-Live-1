# Refresh Token Implementation Guide

## Overview
This document provides a comprehensive guide for the refresh token implementation in the ZEN application. The implementation uses **httpOnly cookies** for secure token storage and automatic token refresh.

## Key Features
✅ **Access Token**: Expires in 15 minutes  
✅ **Refresh Token**: Expires in 7 days  
✅ **Secure Storage**: Tokens stored in httpOnly cookies (not localStorage)  
✅ **Automatic Refresh**: Access token automatically refreshed when expired  
✅ **Backend Integration**: Complete backend support with database persistence  

---

## Architecture

### Token Flow
1. **Login**: User provides credentials
   - Backend generates both access token (15m) and refresh token (7d)
   - Refresh token stored in httpOnly cookie
   - Access token returned in response (also stored in localStorage for backward compatibility)
   - Refresh token hash stored in database

2. **API Requests**: Every authenticated request
   - Access token sent in Authorization header
   - Refresh token automatically sent via httpOnly cookie

3. **Token Expiration**: When access token expires (after 15 minutes)
   - API returns 401 Unauthorized
   - Frontend automatically calls `/auth/refresh-token`
   - Backend validates refresh token from cookie
   - New access token + refresh token generated
   - Original request retried with new access token

4. **Logout**: User logs out
   - Refresh token deleted from database
   - httpOnly cookie cleared
   - User redirected to login

---

## Security Benefits of Cookies vs localStorage

### Why Cookies are More Secure:

1. **HttpOnly Flag**: Prevents JavaScript from accessing the token
   - Protection against XSS (Cross-Site Scripting) attacks
   - Even if malicious script is injected, it cannot steal the refresh token

2. **Secure Flag**: Ensures cookies only sent over HTTPS in production
   - Protection against Man-in-the-Middle attacks

3. **SameSite Attribute**: Prevents CSRF (Cross-Site Request Forgery)
   - Cookies won't be sent from other domains

4. **Automatic Management**: Browser handles cookie sending
   - No manual token management in JavaScript
   - Reduced risk of token exposure

### Why NOT localStorage:

❌ **XSS Vulnerable**: Any script can read localStorage  
❌ **No Expiration**: Tokens can persist indefinitely  
❌ **Manual Management**: Developers must handle everything  
❌ **Global Access**: Any script on the page can access it  

---

## Backend Implementation

### 1. Environment Variables (.env)
```bash
# JWT Configuration
JWT_SECRET=your_secret_key
REFRESH_TOKEN_SECRET=your_refresh_secret_key_should_be_different
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

### 2. JWT Service (jwtService.js)
- Generates access tokens (15 minutes)
- Generates refresh tokens (7 days)
- Verifies both types of tokens
- Uses different secrets for added security

### 3. Refresh Token Service (refreshTokenService.js)
- Stores refresh token hashes in database (not plain tokens)
- Provides methods to find, delete, and purge tokens
- Automatic cleanup of expired tokens

### 4. Auth Controller (authController.js)

#### Login Endpoint: `POST /auth/login`
```javascript
// Response includes:
{
  "token": "access_token_jwt",
  "accessToken": "access_token_jwt",
  "user": {
    "id": "user_uuid",
    "username": "john_doe",
    "role_id": 1,
    "profile_image": "path_or_data_uri"
  },
  "expiresIn": "15m"
}
// Sets httpOnly cookie: refreshToken
```

#### Refresh Endpoint: `POST /auth/refresh-token`
```javascript
// Reads refreshToken from httpOnly cookie
// Response includes:
{
  "token": "new_access_token_jwt",
  "accessToken": "new_access_token_jwt",
  "role_id": 1,
  "r_id": 1
}
// Sets new httpOnly cookie: refreshToken
```

#### Logout Endpoint: `POST /auth/logout`
```javascript
// Deletes refresh token from database
// Clears refreshToken cookie
// Logs action in user_logs table
```

### 5. Cookie Configuration
```javascript
const buildRefreshCookieOptions = () => ({
  httpOnly: true,                    // JavaScript cannot access
  secure: isProduction,              // HTTPS only in production
  sameSite: isProduction ? "none" : "lax",  // CSRF protection
  maxAge: jwtService.REFRESH_TOKEN_MAX_AGE, // 7 days in ms
  path: "/",                         // Available for all routes
});
```

---

## Frontend Implementation

### 1. API Client (client.js)

#### Request Interceptor
```javascript
// Adds access token from localStorage to Authorization header
// Cookies (including refresh token) sent automatically by browser
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### Response Interceptor
```javascript
// Handles 401 errors (expired access token)
// Automatically calls refresh endpoint
// Retries original request with new token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (response?.status === 401 && !config?._retry) {
      config._retry = true
      const data = await requestRefreshToken()
      const newToken = data?.token
      
      if (newToken) {
        localStorage.setItem('token', newToken)
        config.headers.Authorization = `Bearer ${newToken}`
        return apiClient(config) // Retry original request
      }
      
      // If refresh fails, redirect to login
      window.location.href = '/login'
    }
  }
)
```

### 2. Auth Slice (authSlice.js)
- Redux Toolkit slice for authentication state
- Handles login, logout, and token refresh actions
- Stores user data and authentication status
- Integrates with API client for seamless token management

### 3. Protected Routes (ProtectedRoute.jsx)
- Checks token validity before rendering protected components
- Redirects to login if token is expired or invalid
- Supports role-based access control

---

## Database Schema

### refresh_tokens Table
```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,      -- SHA256 hash of refresh token
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Why hash tokens?**
- Even if database is compromised, actual tokens are not exposed
- Follows security best practice of never storing sensitive data in plain text

---

## Testing the Implementation

### 1. Test Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "password": "password123"}' \
  -c cookies.txt  # Save cookies
```

Expected Response:
- Status: 200
- Body contains: `token`, `user` object
- Cookie header includes: `refreshToken` (httpOnly)

### 2. Test Authenticated Request
```bash
curl -X GET http://localhost:3000/api/some-protected-route \
  -H "Authorization: Bearer <access_token>" \
  -b cookies.txt  # Send cookies
```

### 3. Test Token Refresh (after 15 minutes or manually)
```bash
curl -X POST http://localhost:3000/auth/refresh-token \
  -b cookies.txt  # Send refresh token cookie
  -c cookies.txt  # Save new cookies
```

Expected Response:
- Status: 200
- Body contains: new `token`
- New `refreshToken` cookie set

### 4. Test Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

Expected Response:
- Status: 200
- `refreshToken` cookie cleared
- Token deleted from database

---

## Frontend Testing

### Manual Testing Steps:

1. **Login**
   - Open browser DevTools → Application → Cookies
   - Login to the application
   - Verify `refreshToken` cookie is set (httpOnly = true)
   - Verify access token is in localStorage

2. **Wait for Token Expiration**
   - Option A: Wait 15 minutes
   - Option B: Manually change `ACCESS_TOKEN_EXPIRY` to `1m` for faster testing

3. **Trigger API Request**
   - Navigate to a protected page that makes API calls
   - Watch Network tab in DevTools
   - You should see:
     - Original request fails with 401
     - Automatic call to `/auth/refresh-token`
     - Original request retried with new token
     - New `refreshToken` cookie set

4. **Logout**
   - Click logout
   - Verify `refreshToken` cookie is deleted
   - Verify redirected to login page

---

## Migration from localStorage to Cookies

### Current State (Before):
- Access token in localStorage
- No refresh token
- User must re-login after token expires

### New State (After):
- Access token in localStorage (for backward compatibility)
- Refresh token in httpOnly cookie (secure)
- Automatic token refresh without user intervention

### Backward Compatibility:
The implementation maintains localStorage for access tokens to ensure:
- Existing code continues to work
- Gradual migration possible
- Easy rollback if needed

### Future Enhancement:
Consider moving access token to a non-httpOnly cookie as well for full cookie-based auth.

---

## Troubleshooting

### Issue: Refresh token not working
**Check:**
- `withCredentials: true` in axios config
- CORS configured to allow credentials
- Cookie domain matches frontend domain
- Browser allows third-party cookies (if frontend/backend on different domains)

### Issue: Cookie not being set
**Check:**
- Backend is setting cookie in response
- Cookie options are correct (domain, path, sameSite)
- Browser is not blocking cookies
- Response includes `Set-Cookie` header

### Issue: 401 errors after 15 minutes
**Check:**
- Refresh token is in cookies (DevTools → Application → Cookies)
- `/auth/refresh-token` endpoint is accessible
- Response interceptor is properly configured
- No infinite redirect loop (check for proper `_retry` flag)

### Issue: CORS errors
**Check:**
```javascript
// Backend CORS configuration should include:
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## Production Considerations

### 1. Environment Variables
Ensure these are set in production:
```bash
NODE_ENV=production
JWT_SECRET=<strong_random_secret>
REFRESH_TOKEN_SECRET=<different_strong_random_secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

### 2. HTTPS Requirement
- `secure: true` flag requires HTTPS
- Ensure SSL certificate is properly configured
- Consider using a reverse proxy (nginx, CloudFlare)

### 3. Cookie Domain
For subdomains:
```javascript
domain: '.yourcompany.com'  // Works for api.yourcompany.com and app.yourcompany.com
```

### 4. Database Cleanup
Schedule a cron job to purge expired tokens:
```javascript
// Run daily
cron.schedule('0 0 * * *', async () => {
  await refreshTokenService.purgeExpiredTokens();
});
```

### 5. Monitoring
- Log refresh token usage patterns
- Monitor failed refresh attempts
- Alert on unusual token activity

---

## Summary

✅ **Implemented**: Refresh token mechanism with 15-minute access tokens and 7-day refresh tokens  
✅ **Secured**: Tokens stored in httpOnly cookies for XSS protection  
✅ **Automated**: Automatic token refresh on expiration  
✅ **Persistent**: Refresh tokens stored in database with hash  
✅ **Production-Ready**: Proper security configurations for production deployment  

The implementation provides a secure, user-friendly authentication experience while following industry best practices for token management.
