let deviceModule;
try {
  deviceModule = require('device');
} catch (e) {
  throw new Error('device is not installed. Run: npm install device');
}

const BOT_RE = /\b(bot|crawler|spider|crawl|slurp|fetch|mediapartners|pingdom|statuscake|uptime|monitor|scanner|archiver|validator|preview|transcoder)\b/i;

function splitVersion(version) {
  if (!version || typeof version !== 'string') return { raw: version || null, major: null, minor: null, patch: null };
  const parts = version.split('.').map(p => p || null);
  return { raw: version, major: parts[0] || null, minor: parts[1] || null, patch: parts[2] || null };
}

function inferTypeFromUA(ua) {
  if (!ua) return 'desktop';
  if (/\b(ipad|tablet|nexus 7|nexus 9|sm-t|gt-p|kindle|playbook)\b/i.test(ua)) return 'tablet';
  if (/\b(mobile|iphone|ipod|android.*mobile|windows phone|bb10)\b/i.test(ua)) return 'mobile';
  if (BOT_RE.test(ua)) return 'bot';
  return 'desktop';
}

/**
 * Call device module safely with several common shapes:
 * - device(ua) -> object
 * - device.default(ua) -> object
 * - module exports object with .detect or .parse
 */
function callDeviceModule(ua) {
  try {
    if (typeof deviceModule === 'function') {
      // common shape: device(ua)
      return deviceModule(ua);
    }
    if (deviceModule && typeof deviceModule.default === 'function') {
      return deviceModule.default(ua);
    }
    if (deviceModule && typeof deviceModule.detect === 'function') {
      return deviceModule.detect(ua);
    }
    if (deviceModule && typeof deviceModule.parse === 'function') {
      return deviceModule.parse(ua);
    }
    // last resort: if module exports an object with helpful keys, return it
    return deviceModule;
  } catch (err) {
    return null;
  }
}

/**
 * Normalize the result from the device package into a consistent shape.
 *
 * The device package (rguerreiro/device) commonly returns an object with:
 *   { type, model, vendor, version?, manufacturer?, is? }
 *
 * but shapes vary by version. This wrapper is defensive and best-effort.
 */
function parseUserAgent(uaString) {
  const ua = uaString || '';

  // Try to obtain raw result from the module
  let raw = callDeviceModule(ua) || {};

  // If the module returned a middleware-like object when required (rare),
  // attempt to call it again as function result
  if (raw && typeof raw === 'object' && Object.keys(raw).length === 0 && typeof deviceModule === 'function') {
    try {
      raw = deviceModule(ua) || raw;
    } catch (e) {
      // ignore
    }
  }

  // Normalize common fields (best-effort)
  // device package field names seen in practice: type, model, vendor, name, os, manufacturer, brand, is
  const typeRaw = raw.type || raw.deviceType || raw.kind || null; // e.g., 'mobile','tablet','desktop','tv'
  const model = raw.model || raw.name || raw.device || null;
  const vendor = raw.vendor || raw.brand || raw.manufacturer || null;
  const os = raw.os || raw.osName || raw.operatingSystem || null;
  const version = raw.version || raw.osVersion || null;

  // device.has 'is' helper in some libs (function) or boolean flags
  const isChecks = {};
  if (raw && typeof raw.is === 'function') {
    const checks = ['mobile', 'phone', 'tablet', 'desktop', 'tv', 'bot'];
    checks.forEach(k => {
      try { isChecks[k] = !!raw.is(k); } catch (e) { isChecks[k] = false; }
    });
  } else {
    // copy boolean-ish properties if present
    isChecks.mobile = !!(raw.isMobile || raw.mobile || raw.phone);
    isChecks.tablet = !!(raw.isTablet || raw.tablet);
    isChecks.desktop = !!(raw.isDesktop || raw.desktop);
    isChecks.tv = !!(raw.isTv || raw.tv);
    isChecks.bot = !!(raw.isBot || raw.bot);
  }

  // determine final category using explicit type, isChecks, and UA heuristics
  let type = null;
  if (typeRaw) type = String(typeRaw).toLowerCase();
  else if (isChecks.bot) type = 'bot';
  else if (isChecks.tablet) type = 'tablet';
  else if (isChecks.mobile) type = 'mobile';
  else type = inferTypeFromUA(ua);

  // map into friendly category: phone/tablet/desktop/bot/tv/other
  let deviceCategory = 'other';
  if (/bot|crawler|spider/.test(String(type))) deviceCategory = 'bot';
  else if (type === 'mobile' || type === 'phone') deviceCategory = 'phone';
  else if (type === 'tablet') deviceCategory = 'tablet';
  else if (type === 'tv' || type === 'smarttv') deviceCategory = 'tv';
  else if (type === 'desktop' || type === 'pc' || type === 'mac' || type === 'windows') deviceCategory = 'desktop';
  else deviceCategory = type || inferTypeFromUA(ua);

  // final boolean flags
  const isBot = deviceCategory === 'bot' || BOT_RE.test(ua) || !!isChecks.bot;
  const isTablet = deviceCategory === 'tablet' || !!isChecks.tablet;
  const isMobile = deviceCategory === 'phone' || !!isChecks.mobile;
  const isDesktop = deviceCategory === 'desktop' || !!isChecks.desktop || (!isMobile && !isTablet && !isBot);

  return {
    ua,
    // normalized device fields
    type: type || null,
    category: deviceCategory,
    vendor: vendor || null,
    model: model || null,
    os: typeof os === 'string' ? os : (os && os.name ? `${os.name}${os.version ? ' ' + os.version : ''}` : null),
    version: version || null,
    // boolean flags
    isMobile,
    isTablet,
    isDesktop,
    isBot,
    // convenience: is checks (from module if available)
    is: isChecks,
    // version parts if available
    versionParts: splitVersion(version),
    // full raw result for debugging
    raw
  };
}

module.exports = { parseUserAgent };
