# YouTube Cookies Setup Guide

## Why You Need YouTube Cookies

YouTube is blocking requests from cloud hosting providers (like Render, Heroku, etc.) because they detect them as automated/bot traffic. Adding valid YouTube cookies makes your requests appear as if they come from a real logged-in user.

## Step-by-Step Instructions

### 1. Get YouTube Cookies from Your Browser

1. **Open Chrome/Firefox** and go to https://www.youtube.com
2. **Make sure you're logged in** to your YouTube account
3. **Open Developer Tools** (F12 or right-click → Inspect)
4. **Go to Application tab** (Chrome) or Storage tab (Firefox)
5. **Expand Cookies** → **https://www.youtube.com**
6. **Find and copy these cookie values:**

   - `CONSENT`
   - `LOGIN_INFO` 
   - `SID`
   - `HSID`
   - `SSID`
   - `APISID`
   - `SAPISID`
   - `__Secure-1PSID`
   - `__Secure-3PSID`

### 2. Set Environment Variables in Render

1. **Go to your Render dashboard**
2. **Select your service** (yt-dlp-backend)
3. **Go to Environment tab**
4. **Add these environment variables:**

```
YT_CONSENT=YES+cb.20231231-07-p0.en+FX+{}
YT_LOGIN_INFO=your_login_info_value_here
YT_SID=your_sid_value_here
YT_HSID=your_hsid_value_here
YT_SSID=your_ssid_value_here
YT_APISID=your_apisid_value_here
YT_SAPISID=your_sapisid_value_here
YT_SECURE_1PSID=your_secure_1psid_value_here
YT_SECURE_3PSID=your_secure_3psid_value_here
```

### 3. Deploy the Changes

After setting the environment variables, Render will automatically redeploy your service.

### 4. Test the Service

```bash
# Check if cookies are configured
curl https://yt-dlp-backend-wqlz.onrender.com/status

# Try a search
curl "https://yt-dlp-backend-wqlz.onrender.com/search?q=test"

# Try a download
curl "https://yt-dlp-backend-wqlz.onrender.com/download?id=VIDEO_ID&type=mp3"
```

## Important Notes

⚠️ **Security:**
- Never commit cookies to public repositories
- Use environment variables for production
- Update cookies periodically (they expire)

🔄 **Maintenance:**
- Cookies expire every few months
- You'll need to update them when downloads start failing
- Check the `/status` endpoint to see if cookies are configured

🎯 **Expected Results:**
- With cookies: 70-90% success rate
- Without cookies: 10-30% success rate (cloud hosting)

## Alternative Solutions

If cookies don't work well enough:

1. **Use a VPN/Proxy service**
2. **Host on a residential IP address**
3. **Use a different hosting provider**
4. **Implement proxy rotation**

## Troubleshooting

**Q: My cookies don't work anymore**
A: They probably expired. Get fresh cookies from your browser.

**Q: Still getting 429 errors**
A: YouTube is still blocking your server IP. Consider using a proxy.

**Q: How often should I update cookies?**
A: Every 2-3 months, or when downloads start failing consistently. 