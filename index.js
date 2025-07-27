const { execSync } = require('child_process');

// ⬇️ Try to install yt-dlp at runtime
try {
    execSync('apt-get update && apt-get install -y yt-dlp', { stdio: 'inherit' });
} catch (err) {
    console.error("yt-dlp install failed:", err);
}
