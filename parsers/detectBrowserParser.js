let detectModule;
try {
  detectModule = require('detect-browser');
} catch (e) {
  throw new Error('detect-browser is not installed. Run: npm install detect-browser');
}

function resolveDetectFn(mod) {
  if (!mod) return null;
  if (typeof mod.detect === 'function') return mod.detect;
  if (mod && typeof mod.default === 'function') return mod.default;
  if (mod && mod.default && typeof mod.default.detect === 'function') return mod.default.detect;
  if (typeof mod === 'function') return mod;
  return null;
}

const detectFn = resolveDetectFn(detectModule);

const BOT_RE = /\b(bot|crawler|spider|crawl|slurp|fetch|mediapartners|pingdom|statuscake|uptime|monitor|scanner|archiver|validator|preview|transcoder)\b/i;

function splitVersion(version) {
  if (!version || typeof version !== 'string') return { raw: version || null, major: null, minor: null, patch: null };
  const parts = version.split('.').map(p => p || null);
  return { raw: version, major: parts[0] || null, minor: parts[1] || null, patch: parts[2] || null };
}

/**
 * Map detect-browser raw result to an app-friendly category.
 * detect-browser returns objects like { name, version, os, type } where type may be 'browser'|'node'|'react-native'|'bot' etc.
 */
function mapCategory(raw, ua) {
  const type = raw && raw.type ? String(raw.type).toLowerCase() : null;
  const name = raw && raw.name ? String(raw.name).toLowerCase() : null;

  // Bot detection: prefer explicit type/name then fallback to UA regex
  const isBot = Boolean(type === 'bot' || (name && /\b(bot|crawler|spider)\b/i.test(name)) || BOT_RE.test(ua));

  if (isBot) return { category: 'bot', isBot: true };

  // Known client types mapped to phone/tablet/desktop where possible
  // detect-browser doesn't provide device.model/brand, so use heuristics
  if (type === 'react-native') return { category: 'mobile', isBot: false };
  if (type === 'node') return { category: 'server', isBot: false };

  // Heuristic checks on name and UA string to identify mobile/tablet
  if (/\b(ipad|tablet|nexus 7|nexus 9|sm-t|gt-p|kindle|playbook)\b/i.test(ua)) return { category: 'tablet', isBot: false };
  if (/\b(mobile|iphone|ipod|android.*mobile|windows phone|blackberry|bb10)\b/i.test(ua)) return { category: 'phone', isBot: false };

  // fallback: treat browsers as desktop unless UA indicates otherwise
  if (type === 'browser' || name) return { category: 'desktop', isBot: false };

  return { category: 'unknown', isBot: false };
}

/**
 * Parse a UA string using detect-browser and return an expanded normalized shape.
 * Returns:
 * {
 *   ua, name, version, versionParts, os, type, deviceCategory,
 *   isBot, isMobile, isTablet, isDesktop, raw
 * }
 */
function parseUserAgentDetectBrowser(uaString) {
  if (!detectFn) {
    throw new Error('detect-browser detect function not available');
  }

  const ua = uaString || '';

  // detectFn may accept no args (reads global navigator) or UA string
  let raw = null;
  try {
    // prefer calling with UA string
    raw = detectFn(ua) || detectFn();
  } catch (e) {
    // if that fails, try other common exports
    try {
      if (typeof detectModule.parseUserAgent === 'function') raw = detectModule.parseUserAgent(ua);
      else if (detectModule && detectModule.default && typeof detectModule.default.detect === 'function') raw = detectModule.default.detect(ua);
    } catch (ee) {
      raw = null;
    }
  }

  raw = raw || {};

  const name = raw.name || null;
  const version = raw.version || null;
  const versionParts = splitVersion(version);
  const os = raw.os || null;
  const type = raw.type || null;

  const { category: deviceCategory, isBot } = mapCategory(raw, ua);
  const isMobile = deviceCategory === 'phone' || deviceCategory === 'mobile' || /\b(mobile|iphone|android.*mobile)\b/i.test(ua);
  const isTablet = deviceCategory === 'tablet' || /\b(ipad|tablet)\b/i.test(ua);
  const isDesktop = deviceCategory === 'desktop' || (!isMobile && !isTablet && !isBot && deviceCategory !== 'unknown');

  return {
    ua,
    name,
    version,
    versionParts,
    os,
    type,
    deviceCategory, // phone|tablet|desktop|mobile|bot|server|unknown
    isBot,
    isMobile,
    isTablet,
    isDesktop,
    raw
  };
}

module.exports = { parseUserAgentDetectBrowser };
