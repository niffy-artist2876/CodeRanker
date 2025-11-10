# Token Storage in MongoDB

## Overview

This application stores JWT tokens in MongoDB for enhanced security and token management capabilities. Tokens are validated against the database on each request, allowing for token revocation and better session control.

## How It Works

### 1. **Token Storage Flow**

```
Login → PESU Auth validates → JWT token generated → Token stored in MongoDB → Cookie set
```

When a user logs in:
1. Credentials are validated with PESU Auth API
2. JWT token is generated (signed with HMAC-SHA256)
3. Token is stored in MongoDB with:
   - Token string
   - User ID (SRN)
   - Profile data
   - Role
   - Expiration date
   - Created timestamp
4. Token is set as httpOnly cookie

### 2. **Token Validation Flow**

```
Request → Extract token → Verify JWT signature → Check MongoDB → Validate expiration → Authenticated
```

On each protected request:
1. Extract token from cookie or Authorization header
2. Verify JWT signature (HMAC-SHA256)
3. Check if token exists in MongoDB
4. Verify token is not revoked
5. Verify token is not expired
6. Update `lastUsed` timestamp
7. Attach user data to `req.user`

### 3. **Handling "No Matching Token"**

When no token is found in MongoDB, the system:

**Default Behavior (Strict Validation):**
- Returns `401 Unauthorized`
- Message: "Invalid session: Token not found or revoked. Please login again."

**Possible Reasons:**
- Token was revoked (user logged out)
- Token expired (auto-deleted by TTL index)
- Token was never stored (database issue during login)
- Token belongs to different system/instance
- Database connection issue

**Fallback Behavior (Graceful Degradation):**
- If MongoDB is unavailable, falls back to JWT-only validation
- Allows system to continue working during DB outages
- Logs warning for monitoring

## MongoDB Setup

### 1. **Install MongoDB**

```bash
# Windows (using Chocolatey)
choco install mongodb

# Or download from: https://www.mongodb.com/try/download/community
```

### 2. **Start MongoDB**

```bash
# Windows
net start MongoDB

# Or use MongoDB Compass (GUI)
```

### 3. **Environment Variables**

Add to your `.env` file:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/coderanker

# Or use MongoDB Atlas (cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coderanker
```

### 4. **Database Connection**

The app automatically connects to MongoDB on startup. If connection fails:
- App continues running (graceful degradation)
- JWT-only validation works (fallback)
- Logs error for monitoring

## Token Model Schema

```javascript
{
  token: String (unique, indexed),
  userId: String (indexed),
  srn: String (indexed),
  role: String,
  profile: Object,
  expiresAt: Date (TTL index - auto-deletes expired tokens),
  createdAt: Date,
  revoked: Boolean (indexed),
  revokedAt: Date,
  lastUsed: Date
}
```

## Token Operations

### **Create Token** (Automatic on Login)
```javascript
const tokenDoc = await Token.create({
  token,
  userId: srn,
  srn,
  role,
  profile,
  expiresAt
});
```

### **Find Valid Token**
```javascript
const tokenDoc = await Token.findValidToken(token);
// Returns null if token is revoked, expired, or not found
```

### **Revoke Token** (On Logout)
```javascript
const tokenDoc = await Token.findOne({ token, revoked: false });
if (tokenDoc) {
  await tokenDoc.revoke();
}
```

### **Revoke All User Tokens** (Force Logout All Devices)
```javascript
await Token.revokeAllUserTokens(userId);
```

### **Cleanup Expired Tokens** (Manual, though TTL index handles this)
```javascript
await Token.cleanupExpired();
```

## Security Features

### ✅ **Token Revocation**
- Tokens can be revoked without waiting for expiration
- Useful for logout, password changes, security incidents

### ✅ **Auto-Expiration**
- MongoDB TTL index automatically deletes expired tokens
- Reduces database size and improves performance

### ✅ **Token Tracking**
- `lastUsed` timestamp tracks when tokens were last used
- Useful for security monitoring and detecting inactive sessions

### ✅ **Graceful Degradation**
- If MongoDB is unavailable, falls back to JWT-only validation
- System continues working during database outages

### ✅ **Indexed Queries**
- Multiple indexes on frequently queried fields
- Fast token lookups even with millions of tokens

## Error Handling

### **No Token Match Found**

**Scenario:** Token passes JWT verification but not found in MongoDB

**Causes:**
1. Token was revoked (logout)
2. Token expired and auto-deleted
3. Database issue during token creation
4. Token from different environment/system

**Response:**
```json
{
  "message": "Invalid session: Token not found or revoked. Please login again."
}
```

**Status Code:** `401 Unauthorized`

**User Action:** User must login again

### **Database Unavailable**

**Scenario:** MongoDB connection fails during token validation

**Response:**
- Falls back to JWT-only validation
- Logs warning: "Database unavailable, using JWT-only validation"
- Request proceeds if JWT is valid

**Note:** This is a safety mechanism to prevent service disruption

## Best Practices

### 1. **Token Expiration**
- Current: 7 days
- Consider shorter for sensitive operations
- TTL index automatically cleans up expired tokens

### 2. **Token Revocation**
- Always revoke tokens on logout
- Revoke all tokens on password change
- Revoke all tokens on security incidents

### 3. **Database Indexes**
- Already configured for optimal performance
- Compound indexes for common queries
- TTL index for automatic cleanup

### 4. **Monitoring**
- Monitor token creation/validation rates
- Track revoked tokens
- Alert on database connection failures

### 5. **Backup**
- Regular MongoDB backups
- Token data is critical for session management

## Testing

### Test Token Storage

```bash
# 1. Login (creates token in MongoDB)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"PES1UG2XXXXXX","password":"yourpassword"}'

# 2. Verify token in MongoDB
# Connect to MongoDB and check:
db.tokens.find({ userId: "PES1UG2XXXXXX" })

# 3. Use token
curl http://localhost:8080/api/auth/me \
  -H "Cookie: session=YOUR_TOKEN"

# 4. Logout (revokes token)
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Cookie: session=YOUR_TOKEN"

# 5. Try to use revoked token (should fail)
curl http://localhost:8080/api/auth/me \
  -H "Cookie: session=YOUR_TOKEN"
# → 401: Token not found or revoked
```

## Troubleshooting

### **Tokens not being stored**
- Check MongoDB connection
- Verify `MONGODB_URI` in `.env`
- Check MongoDB logs
- App will continue with JWT-only (check logs)

### **"Token not found" errors**
- Token may have been revoked
- Token may have expired
- Check MongoDB connection
- Verify token exists: `db.tokens.find({ token: "..." })`

### **Database connection issues**
- Verify MongoDB is running
- Check connection string format
- Check network/firewall settings
- App falls back to JWT-only (intentional)

## Summary

✅ **Tokens stored in MongoDB for enhanced security**  
✅ **Token revocation support**  
✅ **Automatic expiration cleanup**  
✅ **Graceful degradation if DB unavailable**  
✅ **Comprehensive error handling**  
✅ **Indexed for performance**

Your token system is now production-ready with MongoDB storage!

