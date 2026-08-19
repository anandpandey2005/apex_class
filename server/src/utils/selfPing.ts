import http from 'http';
import https from 'https';
import { env } from '../config/env.config';

export const startSelfPing = () => {
  const intervalMs = (env.PING_INTERVAL_MINUTES || 14) * 60 * 1000;
  
  const urlsToPing = (env.SERVER_SELF_PING_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  if (urlsToPing.length === 0) {
    console.log('⏱️  Self-Ping Keep-Alive service disabled (SERVER_SELF_PING_URL not configured)');
    return null;
  }

  const pingUrl = (targetUrl: string) => {
    try {
      const isHttps = targetUrl.startsWith('https');
      const client = isHttps ? https : http;

      const req = client.get(targetUrl, (res) => {
        console.log(`⏰ [Self-Ping Keep-Alive] Pinged ${targetUrl} - Status: ${res.statusCode}`);
      });

      req.on('error', (err) => {
        console.warn(`⚠️ [Self-Ping Keep-Alive] Notice for ${targetUrl}: ${err.message}`);
      });

      req.end();
    } catch (error) {
      console.warn(`⚠️ [Self-Ping Keep-Alive] Failed to ping ${targetUrl}:`, error);
    }
  };

  const executeAllPings = () => {
    console.log(`\n🔄 [Self-Ping Keep-Alive] Running ${env.PING_INTERVAL_MINUTES}-minute keep-alive ping...`);
    urlsToPing.forEach((url) => pingUrl(url));
  };

  // Run initial ping 10 seconds after server start, then repeat every 14 minutes
  setTimeout(executeAllPings, 10000);
  const timer = setInterval(executeAllPings, intervalMs);

  console.log(`⏱️  Self-Ping Keep-Alive service initialized (Every ${env.PING_INTERVAL_MINUTES} mins for ${urlsToPing.join(', ')})`);
  return timer;
};
