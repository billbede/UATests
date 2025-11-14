let bowser;
try {
  bowser = require('bowser');
} catch (e) {
  throw new Error('bowser is not installed. Run: npm install bowser');
}

const BOT_RE = /\b(bot|crawler|spider|crawl|slurp|fetch|mediapartners|pingdom|statuscake|uptime|monitor|scanner|archiver|validator|preview|transcoder)\b/i;

function splitVersion(version) {
  if (!version || typeof version !== 'string') return { raw: version || null, major: null, minor: null, patch: null };
  const parts = version.split('.').map(p => p || null);
  return { raw: version, major: parts[0] || null, minor: parts[1] || null, patch: parts[2] || null };
}

function inferEngineFromUA(ua) {
  const m = /\b(AppleWebKit|Gecko|Trident|Presto|Blink|EdgeHTML)\/?([0-9\.]*)/i.exec(ua || '');
  if (!m) return { name: null, version: null, versionParts: splitVersion(null) };
  return { name: m[1], version: m[2] || null, versionParts: splitVersion(m[2] || null) };
}

/**
 * Normalizes Bowser parse results into a consistent, maximal shape.
 * Handles multiple export shapes (parse, getParser/getResult, default interop).
 */
function parseUserAgentBowser(uaString) {
  const ua = uaString || '';

  // Resolve rawResult from Bowser in several common ways
  let rawResult = null;

  // 1) bowser.parse(ua)
  if (bowser && typeof bowser.parse === 'function') {
    try { rawResult = bowser.parse(ua); } catch (e) { rawResult = null; }
  }

  // 2) bowser.getParser(ua).getResult()
  if (!rawResult && bowser && typeof bowser.getParser === 'function') {
    try {
      const parser = bowser.getParser(ua);
      rawResult = parser && (typeof parser.getResult === 'function' ? parser.getResult() : parser);
    } catch (e) {
      rawResult = null;
    }
  }

  // 3) default export interop (ESM/CJS)
  if (!rawResult && bowser && bowser.default) {
    const b = bowser.default;
    if (typeof b.parse === 'function') {
      try { rawResult = b.parse(ua); } catch (e) { rawResult = null; }
    } else if (typeof b.getParser === 'function') {
      try {
        const parser = b.getParser(ua);
        rawResult = parser && (typeof parser.getResult === 'function' ? parser.getResult() : parser);
      } catch (e) {
        rawResult = null;
      }
    }
  }

  // 4) last resort: call module as function
  if (!rawResult && typeof bowser === 'function') {
    try { rawResult = bowser(ua); } catch (e) { rawResult = null; }
  }

  if (!rawResult || typeof rawResult !== 'object') {
    return { ua, error: 'Bowser did not return a parse result', raw: rawResult };
  }

  // Bowser fields vary by version. Normalize common fields.
  const browserRaw = rawResult.browser || rawResult.client || rawResult.client || null;
  const engineRaw = rawResult.engine || null;
  const osRaw = rawResult.os || null;
  const platformRaw = rawResult.platform || rawResult.platformType || null;

  const browserName = browserRaw && (browserRaw.name || browserRaw) ? (browserRaw.name || browserRaw) : null;
  const browserVersion = browserRaw && (browserRaw.version || browserRaw.versionName) ? (browserRaw.version || browserRaw.versionName) : null;
  const browserVersionParts = splitVersion(browserVersion);

  const engineName = engineRaw && engineRaw.name ? engineRaw.name : (engineRaw && engineRaw.engine ? engineRaw.engine : null);
  const engineVersion = engineRaw && engineRaw.version ? engineRaw.version : null;
  const engineVersionParts = splitVersion(engineVersion);

  const osName = osRaw && osRaw.name ? osRaw.name : (osRaw && osRaw.os ? osRaw.os : null);
  const osVersion = osRaw && osRaw.version ? osRaw.version : null;
  const osVersionParts = splitVersion(osVersion);

  // Platform can be object or string; try to extract type
  const platformType = platformRaw && (platformRaw.type || platformRaw) ? (platformRaw.type || platformRaw) : null;
  const platformJson = JSON.stringify(platformRaw || {});

  // Device booleans (best-effort)
  const isMobile = /mobile/i.test(String(platformType || '')) || /mobile/i.test(platformJson) || /\b(mobile|iphone|ipod|android.*mobile)\b/i.test(ua);
  const isTablet = /tablet/i.test(String(platformType || '')) || /tablet/i.test(platformJson) || /\b(ipad|tablet|nexus 7|sm-t|kindle)\b/i.test(ua);
  const isDesktop = !isMobile && !isTablet && !BOT_RE.test(ua);

  // Bot detection: Bowser 2.x provides utils.is(bot) but we fallback to regex
  const isBot = Boolean((rawResult && (rawResult.is && typeof rawResult.is === 'function' && rawResult.is('bot'))) || BOT_RE.test(ua) || /bot|crawler|spider/i.test(String(browserName || '')));

  // device object normalization (brand/model may be under different keys)
  const deviceObj = rawResult.platform || rawResult.device || platformRaw || {};
  const deviceType = deviceObj && (deviceObj.type || deviceObj.name || deviceObj) ? (deviceObj.type || deviceObj.name || null) : null;
  const deviceVendor = deviceObj && (deviceObj.vendor || deviceObj.vendorName) ? (deviceObj.vendor || deviceObj.vendorName) : null;
  const deviceModel = deviceObj && (deviceObj.model || deviceObj.modelName) ? (deviceObj.model || deviceObj.modelName) : null;

  // Provide final normalized structure
  return {
    ua,
    // browser
    browser: {
      name: browserName || null,
      version: browserVersion || null,
      versionParts: browserVersionParts,
      raw: browserRaw || null
    },
    // engine
    engine: {
      name: engineName || inferEngineFromUA(ua).name,
      version: engineVersion || inferEngineFromUA(ua).version,
      versionParts: engineVersionParts.ua ? engineVersionParts : inferEngineFromUA(ua).versionParts
    },
    // operating system
    os: {
      name: osName || null,
      version: osVersion || null,
      versionParts: osVersionParts,
      raw: osRaw || null
    },
    // platform / device
    platform: platformRaw || null,
    device: {
      type: deviceType || platformType || null,
      vendor: deviceVendor || null,
      model: deviceModel || null,
      isMobile,
      isTablet,
      isDesktop,
      isBot
    },
    // convenience booleans
    isMobile,
    isTablet,
    isDesktop,
    isBot,
    // raw provider result
    raw: rawResult
  };
}

module.exports = { parseUserAgentBowser };
