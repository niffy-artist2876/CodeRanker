# Authentication & Token System

## Overview

This application uses **JWT (JSON Web Tokens)** signed with **HMAC-SHA256** for secure authentication. The system validates credentials through the PESU Auth API and issues signed tokens for session management.

## How Token Authentication Works

### 1. **JWT Tokens with HMAC-SHA256**

Your JWT tokens are **cryptographically signed** using **HMAC-SHA256** (algorithm: HS256):

- **HMAC-SHA256** = Hash-based Message Authentication Code using SHA-256
- The token signature ensures:
  - **Integrity**: Token cannot be modified without detection
  - **Authenticity**: Token was issued by your server
  - **Non-repudiation**: Cannot deny token creation

### 2. **Token Generation Flow**

```
User Login → PESU Auth API → Credentials Validated → JWT Token Signed (HMAC-SHA256) → Cookie Set
```

**Step-by-step:**

1. User submits SRN/PRN + password
2. Backend calls PESU Auth API to validate credentials
3. On success, backend creates JWT with payload:
   ```json
   {
     "profile": { /* user profile data */ },
     "role": "student",
     "iat": 1234567890,  // issued at
     "exp": 1234567890   // expires at
   }
   ```
4. Token is **signed** using `JWT_SECRET` with HMAC-SHA256
5. Signed token is stored in httpOnly cookie

### 3. **Token Verification Flow**

```
Request → Extract Token → Verify HMAC-SHA256 Signature → Validate Expiry → Authenticated
```

**What happens:**

1. Middleware extracts token from cookie or Authorization header
2. `jwt.verify()` validates the **HMAC-SHA256 signature**
3. If signature is invalid → 401 Unauthorized
4. If token expired → 401 Unauthorized
5. If valid → User data attached to `req.user`

## SHA-256 vs HMAC-SHA256

### SHA-256 (One-way Hash)
- Used for: Password hashing, data integrity checks
- Cannot be reversed
- Example: `sha256Hash("password123")` → `ef92b77...`

### HMAC-SHA256 (Keyed Hash)
- Used for: Token signing, message authentication
- Requires a secret key
- Used internally by JWT for signing tokens
- Example: JWT uses HMAC-SHA256 to sign the token payload

## Your Current Implementation

### ✅ Already Using HMAC-SHA256

Your `authController.js` and `authMiddleware.js` already use HMAC-SHA256:

```javascript
// Token signing (HMAC-SHA256)
jwt.sign(payload, secret, { algorithm: "HS256" })

// Token verification (HMAC-SHA256)
jwt.verify(token, secret, { algorithms: ["HS256"] })
```

### 🔧 Available Utilities

Created `backend/utils/cryptoUtils.js` with SHA-256 utilities:

- `sha256Hash(input)` - Hash strings with SHA-256
- `hmacSha256(data, secret)` - Create HMAC-SHA256 signatures
- `hashPasswordWithSalt()` - Hash passwords with salt
- `verifyPasswordWithSalt()` - Verify password hashes
- `generateSecureToken()` - Generate random tokens

## Security Best Practices

### 1. **JWT Secret**
```bash
# In .env file
JWT_SECRET=your-very-long-random-secret-key-minimum-32-characters
```

**Never commit secrets to git!**

### 2. **Token Expiration**
- Current: 7 days (configurable)
- Consider shorter for sensitive operations

### 3. **Password Handling**
- ✅ PESU Auth handles password validation (external)
- If storing passwords locally, use `bcryptjs` (already in dependencies)
- SHA-256 alone is not recommended for passwords (use bcrypt)

### 4. **Token Storage**
- ✅ httpOnly cookies (prevents XSS)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite: lax (CSRF protection)

## Example: Using SHA-256 Utilities

```javascript
import { sha256Hash, hashPasswordWithSalt, verifyPasswordWithSalt } from "../utils/cryptoUtils.js";

// Hash a string
const hash = sha256Hash("my-data");
// → "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"

// Hash password with salt
const saltedHash = hashPasswordWithSalt("password123", "random-salt");
// → "random-salt:ef92b778b8..."

// Verify password
const isValid = verifyPasswordWithSalt("password123", saltedHash);
// → true
```

## Testing Token Authentication

### Manual Test:

```bash
# 1. Login to get token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"PES1UG2XXXXXX","password":"yourpassword"}'

# 2. Use token in subsequent requests
curl http://localhost:8080/api/auth/me \
  -H "Cookie: session=YOUR_TOKEN_HERE"
```

## Summary

✅ **JWT tokens are already signed with HMAC-SHA256**  
✅ **Token verification validates HMAC-SHA256 signatures**  
✅ **SHA-256 utilities available for other use cases**  
✅ **Secure: httpOnly cookies, expiration, cryptographic signing**

Your authentication system is secure and follows best practices!

