# ✅ Setup Complete!

## Your Configuration is Ready!

### ✅ What's Configured:

1. **MongoDB Connection**
   - Cluster: `aakash.sq09shj.mongodb.net`
   - Database: `kyvex-api`
   - Username: `aakash_db_user`
   - ✅ Connection string complete

2. **Session Security**
   - ✅ Secure session secret generated

3. **Email Service**
   - ✅ Resend API key configured
   - ✅ Email: `aakash@lnovic.com`

4. **Admin Account**
   - Username: `admin`
   - Email: `aakash@lnovic.com`
   - ⚠️ **Password**: `ChangeThisPassword123!` (CHANGE THIS!)

---

## ⚠️ IMPORTANT: Change Admin Password

The `.env` file has a default admin password. **You MUST change it:**

1. Edit `.env` file
2. Change `ADMIN_INITIAL_PASSWORD=ChangeThisPassword123!` to your secure password
3. Or set it when you first deploy

**Recommended strong password:**
- At least 12 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Example: `Admin@Kyvex2024!Secure`

---

## 🚀 Next Steps:

### 1. Update Admin Password in .env

Edit `.env` and change:
```env
ADMIN_INITIAL_PASSWORD=YourSecurePasswordHere
```

### 2. MongoDB IP Whitelist (REQUIRED for Deployment)

For the app to work on Render/cloud:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Login: `aakash@lnovic.com` / `Ram@214387`
3. Click "Network Access" (left sidebar)
4. Click "Add IP Address"
5. Add: `0.0.0.0/0` (allows all IPs - needed for cloud hosting)
6. Click "Confirm"

⚠️ **This is required** - without it, Render won't be able to connect to MongoDB!

### 3. Test Locally (Optional)

```bash
# Install dependencies
npm install

# Start server
npm start
```

Visit:
- Health: http://localhost:3000/health
- Admin: http://localhost:3000/admin
  - Username: `admin`
  - Password: (whatever you set in .env)

### 4. Deploy to Render

1. Push code to GitHub (already done ✅)
2. Go to [Render](https://render.com)
3. Login: `aakash@lnovic.com`
4. Click "New Web Service"
5. Connect your GitHub repo: `aakash688/reverse-kyvex.ai`
6. Configure:
   - **Name**: `kyvex-api-proxy`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
7. Add all environment variables from `.env` file
8. Click "Create Web Service"
9. Wait for deployment
10. Your app will be live at: `https://kyvex-api-proxy.onrender.com`

---

## 📋 Environment Variables for Render

Copy these to Render's environment variables section:

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

## ✅ Checklist Before Deployment:

- [ ] Changed admin password in `.env`
- [ ] MongoDB IP whitelist set to `0.0.0.0/0`
- [ ] All environment variables added to Render
- [ ] Keep-alive enabled (`KEEP_ALIVE_ENABLED=true`)
- [ ] Tested locally (optional but recommended)

---

## 🎉 You're Ready to Deploy!

Everything is configured. Just:
1. Change the admin password
2. Whitelist MongoDB IP
3. Deploy to Render

Good luck! 🚀

