import https from 'https';
import querystring from 'querystring';
import env from '../config/env.js';

// Sends SMS via Africa's Talking (the standard SMS gateway across East
// Africa, including Rwanda). Falls back to a console-logged simulation
// whenever credentials are not configured, so the rest of the app behaves
// identically in a demo environment with no SMS budget.
//
// To enable real delivery:
//   1. Create an account at https://africastalking.com (sandbox is free).
//   2. Set AT_USERNAME and AT_API_KEY in backend/.env.
//   3. Optionally set AT_SENDER_ID if you have a registered short code.
//   4. Set AT_SANDBOX=false once you move off the sandbox app.
//
// This module was written and syntax-checked, but was never executed
// against Africa's Talking's live API in this environment (no outbound
// network access here) — test it yourself against your own account before
// relying on it.

const isConfigured = () => Boolean(env.atUsername && env.atApiKey);

const host = () => (env.atSandbox ? 'api.sandbox.africastalking.com' : 'api.africastalking.com');

export const sendRealSMS = ({ to, message }) =>
  new Promise((resolve, reject) => {
    const payload = querystring.stringify({
      username: env.atUsername,
      to,
      message,
      ...(env.atSenderId ? { from: env.atSenderId } : {}),
    });

    const req = https.request(
      {
        hostname: host(),
        path: '/version1/messaging',
        method: 'POST',
        headers: {
          apiKey: env.atApiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body || '{}'));
          } else {
            reject(new Error(`SMS gateway responded with ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });

// Public entry point used by notificationService. Never throws — logs a
// warning and falls back to simulation so a bad/missing SMS config never
// breaks the rest of the app.
export const sendSMS = async ({ to, message }) => {
  if (!to) return { simulated: true, reason: 'no phone number on file' };

  if (!isConfigured()) {
    console.log(`[sms-sim] -> ${to}: ${message} (set AT_USERNAME/AT_API_KEY in .env to send real SMS)`);
    return { simulated: true };
  }

  try {
    const result = await sendRealSMS({ to, message });
    console.log(`[sms] sent to ${to}`);
    return { simulated: false, result };
  } catch (err) {
    console.error(`[sms] failed to send to ${to}:`, err.message);
    return { simulated: true, error: err.message };
  }
};

export default { sendSMS };
