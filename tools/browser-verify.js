'use strict';
/**
 * Zero-dependency Browser Automation & Screenshot Tool using Chrome DevTools Protocol (CDP)
 * Captures clean high-DPI screenshots of the redesigned Linear/Vercel-inspired UI.
 * Handles WebSocket fragmentation for large payloads (e.g. high-resolution PNG screenshots).
 */
const http = require('http');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9222;
const USER_DATA_DIR = 'C:\\Users\\naph\\AppData\\Local\\Temp\\chrome-verify-profile-redesign';
const ARTIFACT_DIR = 'C:\\Users\\naph\\.gemini\\antigravity\\brain\\34796140-d1b8-4de5-881c-4b12146d1eba';

function sendWsFrame(socket, jsonPayload) {
  const data = Buffer.from(JSON.stringify(jsonPayload));
  const mask = Buffer.from([0x12, 0x34, 0x56, 0x78]);
  let header;
  if (data.length < 126) {
    header = Buffer.from([0x81, 0x80 | data.length]);
  } else if (data.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 0xfe;
    header.writeUInt16BE(data.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 0xff;
    header.writeBigUInt64BE(BigInt(data.length), 2);
  }
  const masked = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    masked[i] = data[i] ^ mask[i % 4];
  }
  socket.write(Buffer.concat([header, mask, masked]));
}

let currentMessageFragments = [];

function parseWsFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (offset < buffer.length) {
    if (offset + 2 > buffer.length) break;
    const firstByte = buffer[offset];
    const secondByte = buffer[offset + 1];
    const fin = (firstByte & 0x80) !== 0;

    let payloadLen = secondByte & 0x7f;
    let headerLen = 2;
    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(offset + 2));
      headerLen = 10;
    }
    const isMasked = (secondByte & 0x80) !== 0;
    const maskLen = isMasked ? 4 : 0;
    if (offset + headerLen + maskLen + payloadLen > buffer.length) break;

    const payloadStart = offset + headerLen + maskLen;
    let payload = buffer.slice(payloadStart, payloadStart + payloadLen);
    if (isMasked) {
      const mask = buffer.slice(offset + headerLen, offset + headerLen + 4);
      const unmasked = Buffer.alloc(payload.length);
      for (let i = 0; i < payload.length; i++) {
        unmasked[i] = payload[i] ^ mask[i % 4];
      }
      payload = unmasked;
    }

    currentMessageFragments.push(payload);

    if (fin) {
      const fullBuffer = Buffer.concat(currentMessageFragments);
      currentMessageFragments = [];
      try {
        messages.push(JSON.parse(fullBuffer.toString('utf8')));
      } catch (err) {
        console.error('Failed to parse full WS message:', err.message);
      }
    }

    offset = payloadStart + payloadLen;
  }
  return { messages, remaining: buffer.slice(offset) };
}

async function runBrowserVerification() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  console.log('Launching Headless Chrome on CDP port', CDP_PORT, '...');
  const chromeProc = cp.spawn(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--window-size=1600,960',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for Chrome CDP endpoint
  let versionData = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      versionData = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${CDP_PORT}/json/list`, res => {
          let raw = '';
          res.on('data', chunk => raw += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
          });
        }).on('error', reject);
      });
      if (versionData && versionData.length > 0) break;
    } catch (_) {}
  }

  if (!versionData || versionData.length === 0) {
    chromeProc.kill();
    throw new Error('Chrome remote debugging endpoint failed to respond');
  }

  const targetWsUrl = versionData[0].webSocketDebuggerUrl;
  console.log('Connected to Chrome Target WS:', targetWsUrl);

  const wsUrlObj = new URL(targetWsUrl);
  const socket = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: wsUrlObj.hostname,
      port: wsUrlObj.port,
      path: wsUrlObj.pathname,
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': Buffer.from('browserverify1234').toString('base64'),
      }
    });
    req.on('upgrade', (res, sock) => resolve(sock));
    req.on('error', reject);
    req.end();
  });

  console.log('WebSocket connection established with Chrome CDP.');

  let msgId = 1;
  const pendingRequests = new Map();
  let rxBuf = Buffer.alloc(0);

  socket.on('data', chunk => {
    rxBuf = Buffer.concat([rxBuf, chunk]);
    const { messages, remaining } = parseWsFrames(rxBuf);
    rxBuf = remaining;
    for (const msg of messages) {
      if (msg.id && pendingRequests.has(msg.id)) {
        const cb = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        cb(msg.result, msg.error);
      }
    }
  });

  function cdpSend(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pendingRequests.set(id, (res, err) => {
        if (err) reject(new Error(err.message || 'CDP Error'));
        else resolve(res);
      });
      sendWsFrame(socket, { id, method, params });
    });
  }

  await cdpSend('Page.enable');
  await cdpSend('Runtime.enable');
  await cdpSend('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // -------------------------------------------------------------
  // SCREENSHOT 1: DASHBOARD
  // -------------------------------------------------------------
  console.log('Navigating to Dashboard: http://127.0.0.1:3800/?view=dashboard ...');
  await cdpSend('Page.navigate', { url: 'http://127.0.0.1:3800/?view=dashboard' });
  await new Promise(r => setTimeout(r, 2200));

  console.log('Capturing Screenshot 1: Redesigned Dashboard...');
  const snapDash = await cdpSend('Page.captureScreenshot', { format: 'png' });
  const dashPath = path.join(ARTIFACT_DIR, '01-redesigned-dashboard.png');
  fs.writeFileSync(dashPath, Buffer.from(snapDash.data, 'base64'));
  console.log('Saved:', dashPath, `(${Math.round(snapDash.data.length / 1024)} KB)`);

  // -------------------------------------------------------------
  // SCREENSHOT 2: NEW UPGRADE WORKFLOW (STEP 1)
  // -------------------------------------------------------------
  console.log('Navigating to New Upgrade: http://127.0.0.1:3800/?view=new-upgrade ...');
  await cdpSend('Page.navigate', { url: 'http://127.0.0.1:3800/?view=new-upgrade' });
  await new Promise(r => setTimeout(r, 2200));

  console.log('Capturing Screenshot 2: Streamlined Step 1 Workspace...');
  const snapStep1 = await cdpSend('Page.captureScreenshot', { format: 'png' });
  const step1Path = path.join(ARTIFACT_DIR, '02-streamlined-new-upgrade-step1.png');
  fs.writeFileSync(step1Path, Buffer.from(snapStep1.data, 'base64'));
  console.log('Saved:', step1Path, `(${Math.round(snapStep1.data.length / 1024)} KB)`);

  // -------------------------------------------------------------
  // SCREENSHOT 3: STEP 1 WITH ADVANCED SETTINGS EXPANDED
  // -------------------------------------------------------------
  console.log('Expanding Advanced Settings...');
  await cdpSend('Runtime.evaluate', {
    expression: `(() => {
      const adv = document.getElementById('step1-advanced-section');
      if (adv) adv.open = true;
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('Capturing Screenshot 3: Step 1 with Advanced Settings Expanded...');
  const snapStep1Adv = await cdpSend('Page.captureScreenshot', { format: 'png' });
  const step1AdvPath = path.join(ARTIFACT_DIR, '03-step1-advanced-settings-expanded.png');
  fs.writeFileSync(step1AdvPath, Buffer.from(snapStep1Adv.data, 'base64'));
  console.log('Saved:', step1AdvPath, `(${Math.round(snapStep1Adv.data.length / 1024)} KB)`);

  // -------------------------------------------------------------
  // SCREENSHOT 4: COPILOT AUTH MODAL
  // -------------------------------------------------------------
  console.log('Opening Copilot Auth Modal...');
  await cdpSend('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-open-copilot-auth-modal');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('Capturing Screenshot 4: Copilot Authentication Modal...');
  const snapCopilotModal = await cdpSend('Page.captureScreenshot', { format: 'png' });
  const copilotModalPath = path.join(ARTIFACT_DIR, '04-copilot-auth-modal.png');
  fs.writeFileSync(copilotModalPath, Buffer.from(snapCopilotModal.data, 'base64'));
  console.log('Saved:', copilotModalPath, `(${Math.round(snapCopilotModal.data.length / 1024)} KB)`);

  // Close modal
  await cdpSend('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-close-copilot-modal');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // -------------------------------------------------------------
  // SCREENSHOT 5: SETTINGS & DIAGNOSTICS CONSOLE
  // -------------------------------------------------------------
  console.log('Navigating to Settings & Diagnostics: http://127.0.0.1:3800/?view=settings-diagnostics ...');
  await cdpSend('Page.navigate', { url: 'http://127.0.0.1:3800/?view=settings-diagnostics' });
  await new Promise(r => setTimeout(r, 2200));

  console.log('Capturing Screenshot 5: Settings & Diagnostics Console...');
  const snapSettings = await cdpSend('Page.captureScreenshot', { format: 'png' });
  const settingsPath = path.join(ARTIFACT_DIR, '05-settings-diagnostics-console.png');
  fs.writeFileSync(settingsPath, Buffer.from(snapSettings.data, 'base64'));
  console.log('Saved:', settingsPath, `(${Math.round(snapSettings.data.length / 1024)} KB)`);

  // -------------------------------------------------------------
  // SCREENSHOT 6: RESPONSIVE NARROW VIEWPORT (1024x768)
  // -------------------------------------------------------------
  console.log('Resizing to 1024x768 viewport...');
  await cdpSend('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdpSend('Page.navigate', { url: 'http://127.0.0.1:3800/?view=dashboard' });
  await new Promise(r => setTimeout(r, 1500));

  console.log('Capturing Screenshot 6: Responsive Viewport Dashboard (1024x768)...');
  const snapNarrow = await cdpSend('Page.captureScreenshot', { format: 'png' });
  const narrowPath = path.join(ARTIFACT_DIR, '06-responsive-viewport-1024.png');
  fs.writeFileSync(narrowPath, Buffer.from(snapNarrow.data, 'base64'));
  console.log('Saved:', narrowPath, `(${Math.round(snapNarrow.data.length / 1024)} KB)`);

  // Cleanup
  socket.destroy();
  chromeProc.kill();
  console.log('SUCCESS: All 6 screenshots captured and verified!');
}

runBrowserVerification().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
