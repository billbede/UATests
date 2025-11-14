const UAParser = require('ua-parser-js');

/**
 * Heuristic bot regex (tunable). This is a pragmatic fallback — replace or extend
 * with a dedicated bot list if you need higher accuracy.
 */
const BOT_RE = /\b(bot|crawler|spider|crawl|slurp|fetch|mediapartners|pingdom|statuscake|uptime|monitor|scanner|archiver|validator|preview|transcoder)\b/i;

/**
 * Normalize a semver-like version string into parts.
 * e.g. "120.0.1" -> { raw: "120.0.1", major: "120", minor: "0", patch: "1" }
 */
function splitVersion(version) {
  if (!version || typeof version !== 'string') return { raw: version || null, major: null, minor: null, patch: null };
  const parts = version.split('.').map(p => p || null);
  return {
    raw: version,
    major: parts[0] || null,
    minor: parts[1] || null,
    patch: parts[2] || null
  };
}

/**
 * Map ua-parser-js device.type to a simple category string:
 * phone, tablet, desktop, bot, other
 *
 * ua-parser-js returns device.type for non-desktop categories and leaves it undefined
 * for desktop — treat undefined as desktop unless a bot is detected.
 */
function mapDeviceCategory(parsed, uaString) {
  const type = parsed && parsed.device && parsed.device.type ? String(parsed.device.type).toLowerCase() : null;
  const ua = uaString || '';
  // Bot detection: prefer parser hints if available, otherwise fallback to regex on UA
  const maybeBotFromParser =
    (parsed && parsed.device && parsed.device.type && String(parsed.device.type).toLowerCase() === 'bot') ||
    (parsed && parsed.browser && parsed.browser.name && /bot/i.test(parsed.browser.name));
  const isBot = Boolean(maybeBotFromParser || BOT_RE.test(ua));

  if (isBot) return { category: 'bot', isBot: true };

  if (type === 'mobile') return { category: 'phone', isBot: false };
  if (type === 'tablet') return { category: 'tablet', isBot: false };
  if (type === 'smarttv' || type === 'console' || type === 'wearable' || type === 'embedded' || type === 'xr')
    return { category: type, isBot: false };

  // ua-parser-js intentionally leaves desktop undefined; default to desktop
  return { category: 'desktop', isBot: false };
}

/**
 * Parse a UA string using ua-parser-js and return an expanded, consistent shape.
 *
 * @param {string} userAgent
 * @returns {object}
 */
function parseUserAgentUAParser(userAgent) {
  const uaString = userAgent || '';
  const parser = new UAParser(uaString);
  const result = parser.getResult() || {};

  // original fields from ua-parser-js
  const browser = result.browser || {};
  const engine = result.engine || {};
  const os = result.os || {};
  const device = result.device || {};
  const cpu = result.cpu || {};

  // split versions into parts
  const browserVersion = splitVersion(browser.version);
  const engineVersion = splitVersion(engine.version);
  const osVersion = splitVersion(os.version);

  // device category mapping and bot heuristic
  const { category: deviceCategory, isBot } = mapDeviceCategory(result, uaString);

  // boolean flags (best-effort)
  const isMobile = deviceCategory === 'phone' || /mobile/i.test(String(uaString));
  const isTablet = deviceCategory === 'tablet' || /ipad|tablet/i.test(String(uaString));
  const isDesktop = deviceCategory === 'desktop' && !isMobile && !isTablet && !isBot;

  return {
    ua: result.ua || uaString,
    // Raw parsed structures (left mostly untouched)
    browser: {
      name: browser.name || null,
      version: browser.version || null,
      major: browser.major || browserVersion.major || null,
      versionParts: browserVersion
    },
    engine: {
      name: engine.name || null,
      version: engine.version || null,
      versionParts: engineVersion
    },
    os: {
      name: os.name || null,
      version: os.version || null,
      versionParts: osVersion
    },
    device: {
      vendor: device.vendor || null,
      model: device.model || null,
      type: device.type || null,
      // keep raw device object for debugging / edge cases
      raw: device
    },
    cpu: {
      architecture: cpu.architecture || null
    },
    // Normalized, application-friendly fields
    deviceCategory,   // 'phone'|'tablet'|'desktop'|'bot'|'smarttv'|'console'|'wearable'|'embedded'|'xr'|'other'
    isBot,
    isMobile,
    isTablet,
    isDesktop,
    // include the full raw ua-parser-js result for completeness
    raw: result
  };
}

module.exports = { parseUserAgentUAParser };
