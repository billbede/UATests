const fs = require('fs');
const path = require('path');

const { parseUserAgentBowser } = require('./parsers/bowserParser');          // bowser wrapper
const { parseUserAgentUAParser } = require('./parsers/uaParser');       // ua-parser-js wrapper
const { parseUserAgentExpressUseragent } = require('./parsers/expressUseragentParser'); // express-useragent wrapper
const { parseUserAgentMyUaParser } = require('./parsers/myUaParser');     // my-ua-parser wrapper

const { parseUserAgentDetectBrowser } = require('./parsers/detectBrowserParser'); // detect-browser wrapper
const { parseUserAgentUseragent } = require('./parsers/useragentParser'); // new useragent wrapper
const { parseUserAgentDeviceDetector } = require('./parsers/deviceDetectorParser'); // device-detector-js wrapper
const { parseUserAgentDevice } = require('./parsers/deviceParser');           // device wrapper

// CONFIG: change these paths/names as desired
const inputPath = path.join(__dirname, 'uas.txt');      // or null to use inline array
const outputPath = path.join(__dirname, 'ua-dump.txt');

// If inputPath is missing or you prefer inline list, put them here:
const inlineUAs = [
  //iPhone Safari (mobile Safari on iOS 17)
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15',

  //iPad Safari (iPadOS 17 desktop-class UA)
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15',

  //WKWebView inside an iOS native app
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WKWebView/1.0',

  //Android Chrome (stable)
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6090.0 Mobile Safari/537.36',

  //Android System WebView (Chromium-based WebView)
  'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 (Android WebView)',

  //Embedded Chromium WebView with explicit AppWebView token
  'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36; AppWebView/1.0',

  //Samsung Internet browser on Android
  'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/22.0 Chrome/108.0.5359.128 Mobile Safari/537.36',

  //Firefox for Android (GeckoView)
  'Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',

  //Microsoft Edge on Android
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 EdgA/114.0.1823.67',

  //Opera Mini (server-side proxy UA)
  'Opera/9.80 (Android; Opera Mini/58.0.2254/191.249; U; en) Presto/2.12.423 Version/12.16',

  //Facebook in-app browser (Android)
  'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36 [FBAN/FB4A;FBAV/437.0.0.50.114;]',

  //Instagram in-app browser (iOS)
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 374.0.0.23.93 (iPhone14,3; iOS 17_0; en_US; en-US; scale=3.00; 1284x2778; 290216128)',

  //HTC Desire HD A9191
  'Mozilla/5.0 (Linux; U; Android 2.3.5; en-gb; HTC Desire HD A9191 Build/GRJ90) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',

  //Native IOS app
  'AppName/269 CFNetwork/1494.0.7 Darwin/23.4.0',

  //Google Bot
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',

  //ChatGPT bot
  'Mozilla/5.0 (compatible; ChatGPTBot/1.0; +https://chat.openai.com/bot)'
];


function readInputUAs() {
  // 1) If inline array has items, use that
  if (Array.isArray(inlineUAs) && inlineUAs.length > 0) {
    return inlineUAs.slice();
  }

  // 2) Try reading plain text file with one UA per line
  if (inputPath && fs.existsSync(inputPath)) {
    const raw = fs.readFileSync(inputPath, 'utf8');
    // If JSON array file detected, attempt to parse
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr)) return arr.map(String);
      } catch (e) {
        // fall back to line-splitting
      }
    }
    return raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  throw new Error('No UAs provided: populate inlineUAs or create uas.txt');
}

// Helper that reproduces the server.js output for a single UA
function renderForUA(uaString) {
  const ua = uaString || '';
  let out = '';
  out += `================================================================================\n`;
  out += `================================================================================\n`;
  out += `================================================================================\n`;
  out += `${JSON.stringify({ 'user-agent': ua }, null, 2)}\n\n`;


  // bowser parsed info
  try {
    const bowserInfo = parseUserAgentBowser(ua);
    out += 'bowser Parsed Info:\n';
    out += JSON.stringify(bowserInfo, null, 2);
    out += '\n\n';
  } catch (err) {
    out += 'bowser Parsed Info:\n';
    out += JSON.stringify({ error: String(err) }, null, 2);
    out += '\n\n';
  }

  // ua-parser-js parsed info
  try {
    const uaInfo = parseUserAgentUAParser(ua);
    out += 'ua-parser-js Parsed Info:\n';
    out += JSON.stringify(uaInfo, null, 2);
    out += '\n\n';
  } catch (err) {
    out += 'ua-parser-js Parsed Info:\n';
    out += JSON.stringify({ error: String(err) }, null, 2);
    out += '\n\n';
  }

  // express-useragent parsed info
  try {
    const euInfo = parseUserAgentExpressUseragent(ua);
    out += 'express-useragent Parsed Info:\n';
    out += JSON.stringify(euInfo, null, 2);
    out += '\n\n';
  } catch (err) {
    out += 'express-useragent Parsed Info:\n';
    out += JSON.stringify({ error: String(err) }, null, 2);
    out += '\n\n';
  }

  // my-ua-parser parsed info
  try {
    const myUaInfo = parseUserAgentMyUaParser(ua);
    out += 'my-ua-parser Parsed Info:\n';
    out += JSON.stringify(myUaInfo, null, 2);
    out += '\n\n';
  } catch (err) {
    out += 'my-ua-parser Parsed Info:\n';
    out += JSON.stringify({ error: String(err) }, null, 2);
    out += '\n\n';
  }


  // NOT ACTIVE
  /*
    // detect-browser parsed info
    try {
      const dbInfo = parseUserAgentDetectBrowser(ua);
      out += 'detect-browser Parsed Info:\n';
      out += JSON.stringify(dbInfo, null, 2);
      out += '\n\n';
    } catch (err) {
      out += 'detect-browser Parsed Info:\n';
      out += JSON.stringify({ error: String(err) }, null, 2);
      out += '\n\n';
    }
  
    // useragent parsed info
    try {
      const uaUseragentInfo = parseUserAgentUseragent(ua);
      out += 'useragent Parsed Info:\n';
      out += JSON.stringify(uaUseragentInfo, null, 2);
      out += '\n\n';
    } catch (err) {
      out += 'useragent Parsed Info:\n';
      out += JSON.stringify({ error: String(err) }, null, 2);
      out += '\n\n';
    }
  
    // device-detector-js parsed info
    try {
      const ddInfo = parseUserAgentDeviceDetector(ua);
      out += 'device-detector-js Parsed Info:\n';
      out += JSON.stringify(ddInfo, null, 2);
      out += '\n\n';
    } catch (err) {
      out += 'device-detector-js Parsed Info:\n';
      out += JSON.stringify({ error: String(err) }, null, 2);
      out += '\n\n';
    }
  
    // device parsed info
    try {
      const deviceInfo = parseUserAgentDevice(ua);
      out += 'device Parsed Info:\n';
      out += JSON.stringify(deviceInfo, null, 2);
      out += '\n\n';
    } catch (err) {
      out += 'device Parsed Info:\n';
      out += JSON.stringify({ error: String(err) }, null, 2);
      out += '\n\n';
    }
  */

  return out;
}

function run() {
  const uas = readInputUAs();
  if (!uas.length) {
    console.error('No user agents found. Provide uas.txt or populate inlineUAs.');
    process.exit(1);
  }

  // Ensure output file is empty to start
  fs.writeFileSync(outputPath, '', 'utf8');

  for (let i = 0; i < uas.length; i++) {
    const ua = uas[i];
    const block = renderForUA(ua);
    fs.appendFileSync(outputPath, block, 'utf8');
    console.log(`Wrote UA ${i + 1}/${uas.length}`);
  }

  console.log(`All done. Output written to ${outputPath}`);
}

run();
