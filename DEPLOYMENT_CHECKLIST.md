# 🚀 Deployment Checklist - SPA Routing Fix

## ✅ Pre-Deployment Verification

### Files in Place
```bash
# Check these files exist:
✅ public/_redirects
✅ netlify.toml
✅ dist/_redirects (after build)

# Verify with:
ls -la public/_redirects
cat public/_redirects
# Should show: /*  /index.html  200

ls -la netlify.toml
cat netlify.toml
# Should show: [build] section with [[redirects]]
```

### Build Success
```bash
npm run build

# Expected output:
✓ 1642 modules transformed
✓ built in ~8s
✅ dist/_redirects exists
✅ dist/index.html exists
```

---

## 🧪 Post-Deployment Testing

### Test 1: Direct URL Access
Open these URLs **directly** in browser (not through navigation):

```
Test: https://yourapp.com/auth/callback
Expected: ✅ App loads (may show error "no session" - that's OK)
NOT Expected: ❌ 404 page

Test: https://yourapp.com/auth/reset-password
Expected: ✅ App loads
NOT Expected: ❌ 404 page

Test: https://yourapp.com/app/dashboard
Expected: ✅ App loads (redirects to login if not authenticated)
NOT Expected: ❌ 404 page

Test: https://yourapp.com/random/path/that/doesnt/exist
Expected: ✅ App loads, shows React Router 404 component
NOT Expected: ❌ Hosting 404 page
```

### Test 2: Email Confirmation Flow
```
1. Register new account
2. Open email
3. Click confirmation link
4. Should redirect to /auth/callback
5. ✅ Expected: Workspace provisioning → Dashboard
6. ❌ NOT Expected: 404 page
```

### Test 3: Password Reset Flow
```
1. Go to /auth/forgot-password
2. Enter email
3. Open email
4. Click reset link
5. Should redirect to /auth/reset-password
6. ✅ Expected: Password reset form
7. ❌ NOT Expected: 404 page
```

### Test 4: Login Flow
```
1. Go to /auth/login
2. Enter credentials
3. Click login
4. Should redirect to /auth/callback
5. ✅ Expected: Dashboard
6. ❌ NOT Expected: 404 page
```

---

## 🔧 Troubleshooting

### Problem: Still getting 404 after deployment

**Check 1: _redirects file in build output**
```bash
# On your local machine after build:
ls dist/_redirects

# If missing, check:
ls public/_redirects

# Rebuild:
npm run build
```

**Check 2: Hosting platform**
Different platforms handle redirects differently:

**Netlify:**
- Reads `_redirects` file ✅
- Reads `netlify.toml` ✅

**Vercel:**
- Needs `vercel.json` with rewrites
- OR use `_redirects` file

**bolt.host:**
- Should read `_redirects` file ✅
- May need `netlify.toml` ✅

**Check 3: Deploy folder**
Make sure hosting is deploying from `dist/` folder, not root.

**Check 4: Browser cache**
Clear browser cache or use incognito mode to test.

---

## 📋 Quick Reference

### _redirects Format
```
/*  /index.html  200
```

**DO NOT:**
- ❌ Use status 301 (permanent redirect)
- ❌ Use status 302 (temporary redirect)
- ❌ Add multiple rules (just one is enough)

**DO:**
- ✅ Use status 200 (rewrite/serve)
- ✅ Keep it simple: `/*` catches everything
- ✅ Point to `/index.html`

### netlify.toml Format
```toml
[build]
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## ✅ Success Indicators

After successful deployment:

1. **No 404 on auth redirects** ✅
2. **Email confirmation works** ✅
3. **Password reset works** ✅
4. **Direct URL access works** ✅
5. **Refresh on any page works** ✅

---

## 🆘 Still Having Issues?

If you're still seeing 404s after deployment:

1. **Check hosting logs** - what file is it trying to serve?
2. **Check hosting settings** - is it deploying from `dist/`?
3. **Check file upload** - is `_redirects` uploaded?
4. **Try different platform** - test on Netlify (known to work)
5. **Contact hosting support** - some platforms need special config

---

## 📞 Support

If problems persist, check:
- Hosting platform documentation for SPA routing
- Check if platform supports `_redirects` file
- Check if platform needs different config file

Common alternatives:
- `vercel.json` for Vercel
- `.htaccess` for Apache
- `nginx.conf` for Nginx
- `web.config` for IIS

---

**Last Updated:** 2026-01-08
**Status:** ✅ Configured and Ready
