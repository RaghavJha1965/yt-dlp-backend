# YouTube Cookies Setup for Your Backend

Based on your extracted cookies, here are the exact environment variables to set in Render:

## Environment Variables for Render

Go to your Render dashboard → Environment tab and add these variables:

```
YT_CONSENT=YES+cb.20231231-07-p0.en+FX+{}
YT_LOGIN_INFO=AFmmF2swRQIhAPtxIGKxMBJsRZP6MblnQGXWjIM7WkvJiSsA5wCALe2IAiAsPcDde5h3e-EpPwOe0RYMZHpLkgxvv-CsXyDdifFTUg:QUQ3MjNmem1LM0MwV2UydEVXYjRKLUp4Y1g1Z3pkelVRbENnVVBMVXF3bzVLaDBHYkppRGt2R0tIVXJZdGNRWG9QTHowSmVoNW5uZzR1YU83NENzdDUwTmU5V2lfQ1JmdXA4LUItX256SnhGRFJrVlZIYjZkelpIbE9PRkljdE9Hak9IamRPdDRycHNQN0dDZjZqclJsSkg3cUJwZkVucHRn
YT_SID=g.a000ywh2AwB2LOnf_NI4BA_zg6P5j1sNhPRqapyRKqih1k3XQspq0rPNJkM4KK87kIxTr1BwMAACgYKAaQSARcSFQHGX2MiqtyQZoSph9bZWGmxi_tY6hoVAUF8yKoDVWD1R4WNKHDax1idgyT40076
YT_HSID=AqUdmsGhOPgGH_R9w
YT_SSID=AqUdmsGhOPgGH_R9w
YT_APISID=-aM1VB0DVvQyhK5F/A57oudEm7yG6ogzEQ
YT_SAPISID=-aM1VB0DVvQyhK5F/A57oudEm7yG6ogzEQ
YT_SECURE_1PSID=g.a000ywh2AwB2LOnf_NI4BA_zg6P5j1sNhPRqapyRKqih1k3XQspq0rPNJkM4KK87kIxTr1BwMAACgYKAaQSARcSFQHGX2MiqtyQZoSph9bZWGmxi_tY6hoVAUF8yKoDVWD1R4WNKHDax1idgyT40076
YT_SECURE_3PSID=g.a000ywh2AwB2LOnf_NI4BA_zg6P5j1sNhPRqapyRKqih1k3XQspq0rPNJkM4KK87kIxTr1BwMAACgYKAaQSARcSFQHGX2MiqtyQZoSph9bZWGmxi_tY6hoVAUF8yKoDVWD1R4WNKHDax1idgyT40076
```

## Steps to Set Up:

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Select your `yt-dlp-backend` service

2. **Navigate to Environment**
   - Click on the "Environment" tab
   - Click "Add Environment Variable"

3. **Add Each Variable**
   - Copy and paste each line above
   - Make sure to include the `YT_` prefix
   - Click "Save Changes"

4. **Redeploy**
   - Render will automatically redeploy your service
   - Wait for the deployment to complete

5. **Test the Service**
   ```bash
   # Check if cookies are configured
   curl https://yt-dlp-backend-wqlz.onrender.com/status
   
   # Test search
   curl "https://yt-dlp-backend-wqlz.onrender.com/search?q=test"
   
   # Test download (replace VIDEO_ID with actual ID)
   curl "https://yt-dlp-backend-wqlz.onrender.com/download?id=VIDEO_ID&type=mp3"
   ```

## Expected Results:

With these cookies, you should see:
- ✅ Much higher success rate (70-90%)
- ✅ Fewer "Sign in to confirm" errors
- ✅ Better download reliability
- ✅ Status endpoint showing `cookiesConfigured: true`

## Important Notes:

⚠️ **Security:**
- These cookies are from your personal YouTube account
- Keep them private and don't share them
- They will expire in a few months

🔄 **Maintenance:**
- Update cookies when downloads start failing
- Check `/status` endpoint to verify configuration
- Cookies typically last 2-3 months

🎯 **Testing:**
- Try searching for popular videos first
- Test with different video types (short, long, music)
- Monitor the console logs for which strategies work

## Troubleshooting:

If it still doesn't work:
1. **Check the `/status` endpoint** - should show `cookiesConfigured: true`
2. **Wait 2-3 minutes** between requests (rate limiting)
3. **Try different video IDs** - some videos may be restricted
4. **Check Render logs** for detailed error messages

Your backend should now work much better with these cookies! 🚀 