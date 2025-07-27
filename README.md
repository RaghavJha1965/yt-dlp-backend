# YouTube Downloader Backend

A Node.js backend service for searching and downloading YouTube videos using yt-dlp.

## Features

- 🔍 Search YouTube videos
- ⬇️ Download videos as MP4 or MP3
- 🛡️ Rate limiting and anti-bot detection
- 🍪 Cookie-based authentication
- 🧹 Automatic file cleanup
- 📊 Health check endpoint

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get YouTube Cookies (Recommended)

To avoid rate limiting and bot detection, you should provide YouTube cookies:

1. Open your browser and go to https://www.youtube.com
2. Make sure you're logged in to YouTube
3. Open Developer Tools (F12)
4. Go to Application/Storage tab
5. Look for Cookies under https://www.youtube.com
6. Copy the values for these cookies:
   - `CONSENT`
   - `LOGIN_INFO`
   - `SID`
   - `HSID`
   - `SSID`
   - `APISID`
   - `SAPISID`
   - `__Secure-1PSID`
   - `__Secure-3PSID`

### 3. Set Environment Variables

Create a `.env` file or set environment variables:

```bash
# YouTube Cookies (optional but recommended)
YT_CONSENT=YES+cb.20231231-07-p0.en+FX+{}
YT_LOGIN_INFO=your_login_info_here
YT_SID=your_sid_here
YT_HSID=your_hsid_here
YT_SSID=your_ssid_here
YT_APISID=your_apisid_here
YT_SAPISID=your_sapisid_here
YT_SECURE_1PSID=your_secure_1psid_here
YT_SECURE_3PSID=your_secure_3psid_here

# Server Configuration
PORT=5000
```

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Search Videos
```
GET /search?q=<query>
```

**Response:**
```json
[
  {
    "id": "video_id",
    "title": "Video Title",
    "duration": "10:30",
    "thumbnail": "https://..."
  }
]
```

### Download Video/Audio
```
GET /download?id=<video_id>&type=<mp3|mp4>
```

**Parameters:**
- `id`: YouTube video ID (11 characters)
- `type`: `mp3` for audio, `mp4` for video

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "endpoints": ["/search", "/download", "/health"]
}
```

## Rate Limiting

- **5 requests per minute** per client IP
- Applies to both search and download endpoints
- Returns HTTP 429 when exceeded

## Troubleshooting

### HTTP 429 "Too Many Requests"

This happens when YouTube detects too many requests from your server. Solutions:

1. **Add YouTube cookies** (most effective)
2. **Reduce request frequency**
3. **Use a proxy/VPN**
4. **Wait and retry later**

### "Sign in to confirm you're not a bot"

YouTube is blocking requests as automated. Solutions:

1. **Add valid YouTube cookies**
2. **Update cookies periodically**
3. **Use different IP addresses**
4. **Reduce request volume**

### Download Failures

1. **Check video ID format** (must be 11 characters)
2. **Verify video is available** (not private/deleted)
3. **Try different format options**
4. **Check server logs for specific errors**

## Security Notes

- ⚠️ **Never commit cookies to public repositories**
- 🔒 **Use environment variables for production**
- 🕒 **Update cookies periodically** (they expire)
- 🌐 **Consider using proxy rotation** for high traffic

## Deployment

### Render.com

1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy automatically on push

### Environment Variables for Render

Add these in your Render service settings:

```
YT_CONSENT=YES+cb.20231231-07-p0.en+FX+{}
YT_LOGIN_INFO=your_value_here
YT_SID=your_value_here
YT_HSID=your_value_here
YT_SSID=your_value_here
YT_APISID=your_value_here
YT_SAPISID=your_value_here
YT_SECURE_1PSID=your_value_here
YT_SECURE_3PSID=your_value_here
```

## Development

### Helper Scripts

```bash
# Get cookie extraction instructions
node get-cookies.js

# Run with nodemon for development
npm run dev
```

### File Structure

```
yt-dlp-backend/
├── index.js          # Main server file
├── get-cookies.js    # Cookie extraction helper
├── package.json      # Dependencies
└── README.md         # This file
```

## License

ISC License - see package.json for details.

## Disclaimer

This tool is for educational purposes. Please respect YouTube's Terms of Service and use responsibly. The developers are not responsible for any misuse of this software. 