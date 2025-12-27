# 🔐 Complete .env Configuration

## Create Your .env File

Create a file named `.env` in the root directory with this exact content:

```env
# ============================================
# Kyvex.ai API Proxy - Environment Variables
# ============================================

# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://aakash_db_user:0zbr3r5EA1wl2Ieg@aakash.sq09shj.mongodb.net/kyvex-api?retryWrites=true&w=majority

# Kyvex.ai API Configuration
KYVEX_API_URL=https://kyvex.ai/api/v1

# Session Configuration
SESSION_SECRET=V9ZdQSUGxrXvuof1Gm1GCD3Pi0eHMXmOtlWLGlHOqcY=
SESSION_NAME=admin_session
SESSION_MAX_AGE=86400000

# Admin Configuration
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=ChangeThisPassword123!
ADMIN_INITIAL_EMAIL=aakash@lnovic.com

# Email Configuration (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_45aVXFjE_7JRDVxj5Hizkqs9VFivDZjRf
EMAIL_FROM=aakash@lnovic.com

# Keep-Alive Configuration (for Render)
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_INTERVAL=300000

# Security Configuration
BCRYPT_ROUNDS=10
PASSWORD_RESET_EXPIRY=3600000
```

## ⚠️ IMPORTANT: Change Admin Password

**Before deploying, change this line:**
```env
ADMIN_INITIAL_PASSWORD=ChangeThisPassword123!
```

**To your secure password:**
```env
ADMIN_INITIAL_PASSWORD=YourSecurePasswordHere
```

---

## 📋 Quick Copy for Render Deployment

When deploying to Render, copy these environment variables:

```
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://aakash_db_user:0zbr3r5EA1wl2Ieg@aakash.sq09shj.mongodb.net/kyvex-api?retryWrites=true&w=majority
KYVEX_API_URL=https://kyvex.ai/api/v1
SESSION_SECRET=V9ZdQSUGxrXvuof1Gm1GCD3Pi0eHMXmOtlWLGlHOqcY=
SESSION_NAME=admin_session
SESSION_MAX_AGE=86400000
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=YourSecurePasswordHere
ADMIN_INITIAL_EMAIL=aakash@lnovic.com
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_45aVXFjE_7JRDVxj5Hizkqs9VFivDZjRf
EMAIL_FROM=aakash@lnovic.com
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_INTERVAL=300000
BCRYPT_ROUNDS=10
PASSWORD_RESET_EXPIRY=3600000
```

---

## ✅ Configuration Summary

- ✅ MongoDB: `aakash.sq09shj.mongodb.net`
- ✅ Database: `kyvex-api`
- ✅ Username: `aakash_db_user`
- ✅ Session Secret: Generated
- ✅ Resend API: Configured
- ✅ Email: `aakash@lnovic.com`
- ⚠️ Admin Password: **CHANGE THIS!**

---

## 🚀 Next Steps

1. **Create `.env` file** with the content above
2. **Change admin password** in `.env`
3. **Whitelist MongoDB IP**: Add `0.0.0.0/0` in MongoDB Atlas Network Access
4. **Deploy to Render** with the environment variables above

You're all set! 🎉

