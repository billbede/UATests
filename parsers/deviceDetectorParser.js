const DeviceDetector = require('device-detector-js');

// Create a single detector instance to reuse across calls
const detector = new DeviceDetector();

const BOT_RE = /\b(bot|crawler|spider|crawl|slurp|fetch|mediapartners|pingdom|statuscake|uptime|monitor|scanner|archiver|validator|preview|transcoder)\b/i;

function splitVersion(version) {
  if (!version || typeof version !== 'string') return { raw: version || null, major: null, minor: null, patch: null };
  const parts = version.split('.').map(p => p || null);
  return { raw: version, major: parts[0] || null, minor: parts[1] || null, patch: parts[2] || null };
}

/**
 * Map device-detector-js 'client.type' and 'device.type' to an app-friendly category.
 * Device-detector-js uses types like: browser, library, feed reader (client), and device types:
 * smartphone, tablet, desktop, tv, car, console, wearable, etc.
 */
function mapCategory(result, ua) {
  // bot detection from device-detector-js
  if (result && result.bot && Object.keys(result.bot).length > 0) {
    return { category: 'bot', isBot: true, bot: result.bot };
  }

  // prefer device.type when available
  const deviceType = result && result.device && result.device.type ? String(result.device.type).toLowerCase() : null;
  if (deviceType) {
    if (deviceType === 'smartphone' || deviceType === 'feature phone' || deviceType === 'phablet') return { category: 'phone', isBot: false };
    if (deviceType === 'tablet') return { category: 'tablet', isBot: false };
    if (deviceType === 'desktop' || deviceType === 'pc') return { category: 'desktop', isBot: false };
    if (deviceType === 'tv' || deviceType === 'smarttv') return { category: 'tv', isBot: false };
    if (deviceType === 'car') return { category: 'car', isBot: false };
    if (deviceType === 'console') return { category: 'console', isBot: false };
    if (deviceType === 'wearable') return { category: 'wearable', isBot: false };
  }

  // fallback to client.type (browser, library, feed reader, etc.)
  const clientType = result && result.client && result.client.type ? String(result.client.type).toLowerCase() : null;
  if (clientType === 'browser') return { category: 'desktop', isBot: false }; // default browser -> desktop unless device says otherwise
  if (clientType === 'library' || clientType === 'crawler' || clientType === 'bot') return { category: 'bot', isBot: true };

  // heuristic UA-based fallback
  if (BOT_RE.test(ua)) return { category: 'bot', isBot: true };
  if (/\b(ipad|tablet|nexus 7|nexus 9|sm-t|gt-p|kindle|playbook)\b/i.test(ua)) return { category: 'tablet', isBot: false };
  if (/\b(mobile|iphone|ipod|android.*mobile|windows phone|blackberry|bb10)\b/i.test(ua)) return { category: 'phone', isBot: false };

  // default to desktop
  return { category: 'desktop', isBot: false };
}

/**
 * Parse a UA string using device-detector-js and return a normalized object.
 * @param {string} uaString
 * @returns {object}
 */
function parseUserAgentDeviceDetector(uaString) {
  const ua = uaString || '';
  const result = detector.parse(ua) || {};

  // client: { type, name, short_name?, version, engine? }
  const client = result.client || null;
  const clientName = client && (client.name || client.brand || client.short_name) ? (client.name || client.brand || client.short_name) : null;
  const clientVersion = client && (client.version || client.versionName) ? (client.version || client.versionName) : null;
  const clientVersionParts = splitVersion(clientVersion);

  // os: { name, version }
  const os = result.os || null;
  const osName = os && (os.name || os.platform) ? (os.name || os.platform) : null;
  const osVersion = os && (os.version || os.os_version) ? (os.version || os.os_version) : null;
  const osVersionParts = splitVersion(osVersion);

  // device: { type, brand, model }
  const device = result.device || null;
  const deviceType = device && device.type ? device.type : null;
  const deviceBrand = device && (device.brand || device.manufacturer) ? (device.brand || device.manufacturer) : null;
  const deviceModel = device && device.model ? device.model : null;

  // bot: object when detected
  const bot = result.bot || null;

  // map category & flags
  const { category: deviceCategory, isBot } = mapCategory(result, ua);
  const isMobile = deviceCategory === 'phone' || deviceCategory === 'phablet' || /mobile/i.test(ua);
  const isTablet = deviceCategory === 'tablet' || /ipad|tablet/i.test(ua);
  const isDesktop = deviceCategory === 'desktop' || (!isMobile && !isTablet && !isBot);

  // engine inference (device-detector-js sometimes doesn't return engine)
  const engineMatch = /\b(AppleWebKit|Gecko|Trident|Presto|Blink|EdgeHTML)\/?([0-9\.]*)/i.exec(ua || '');
  const engine = engineMatch ? { name: engineMatch[1], version: engineMatch[2] || null, versionParts: splitVersion(engineMatch[2] || null) } : (result.client && result.client.engine ? result.client.engine : { name: null, version: null, versionParts: splitVersion(null) });

  return {
    ua,
    // client/browser
    client: {
      type: client && client.type ? client.type : null, // browser/library/feedreader
      name: clientName,
      version: clientVersion || null,
      versionParts: clientVersionParts,
      raw: client || null
    },
    // operating system
    os: {
      name: osName,
      version: osVersion || null,
      versionParts: osVersionParts,
      raw: os || null
    },
    // device
    device: {
      type: deviceType,
      brand: deviceBrand,
      model: deviceModel,
      raw: device || null
    },
    // bot info (null if not bot)
    bot: bot || null,
    // engine
    engine,
    // normalized category + booleans
    deviceCategory, // phone|tablet|desktop|tv|car|console|wearable|bot|...
    isBot,
    isMobile,
    isTablet,
    isDesktop,
    // include the full raw provider result for inspection
    raw: result
  };
}

module.exports = { parseUserAgentDeviceDetector };
