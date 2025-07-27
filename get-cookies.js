#!/usr/bin/env node

/**
 * Helper script to extract YouTube cookies from your browser
 * 
 * Instructions:
 * 1. Open your browser and go to https://www.youtube.com
 * 2. Make sure you're logged in to YouTube
 * 3. Open Developer Tools (F12)
 * 4. Go to Application/Storage tab
 * 5. Look for Cookies under https://www.youtube.com
 * 6. Copy the values for the cookies listed below
 */

console.log(`
🔍 YouTube Cookie Extractor
============================

To get YouTube cookies for better anti-detection:

1. Open your browser and go to https://www.youtube.com
2. Make sure you're logged in to YouTube
3. Open Developer Tools (F12)
4. Go to Application/Storage tab
5. Look for Cookies under https://www.youtube.com
6. Copy the values for these cookies:

Required cookies:
- CONSENT
- LOGIN_INFO
- SID
- HSID
- SSID
- APISID
- SAPISID
- __Secure-1PSID
- __Secure-3PSID

Then update the YOUTUBE_COOKIES object in index.js with the actual values.

Example:
const YOUTUBE_COOKIES = {
    'CONSENT': 'YES+cb.20231231-07-p0.en+FX+{}',
    'LOGIN_INFO': 'AFmmF2swRQIg...', // Your actual value
    'SID': '...', // Your actual value
    // ... etc
};

⚠️  Important:
- Keep these cookies private (don't commit to public repos)
- Update them periodically as they expire
- Use environment variables for production
`);

// You can also use this to test cookie extraction
const testCookies = {
    'CONSENT': 'YES+cb.20231231-07-p0.en+FX+{}',
    'LOGIN_INFO': 'AFmmF2swRQIg...',
    'SID': '...',
    'HSID': '...',
    'SSID': '...',
    'APISID': '...',
    'SAPISID': '...',
    '__Secure-1PSID': '...',
    '__Secure-3PSID': '...'
};

const cookieString = Object.entries(testCookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');

console.log('\nExample cookie string format:');
console.log(cookieString); 