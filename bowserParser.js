let bowser;
try {
  bowser = require('bowser');
} catch (e) {
  throw new Error('bowser is not installed. Run: npm install bowser');
}

/**
 * Normalize Bowser result into a compact, consistent shape.
 * @param {string} uaString
 * @returns {object}
 */
function parseUserAgentBowser(uaString) {
  const ua = uaString || '';

  // Determine how to call Bowser depending on export shape
  let rawResult = null;

  // 1) bowser.parse(ua)
  if (bowser && typeof bowser.parse === 'function') {
    rawResult = bowser.parse(ua);
  }

  // 2) bowser.getParser(ua).getResult()
  else if (bowser && typeof bowser.getParser === 'function') {
    try {
      const parser = bowser.getParser(ua);
      rawResult = parser && (typeof parser.getResult === 'function' ? parser.getResult() : parser);
    } catch (err) {
      rawResult = null;
    }
  }

  // 3) default export shapes (ES module interop)
  else if (bowser && bowser.default) {
    const b = bowser.default;
    if (typeof b.parse === 'function') rawResult = b.parse(ua);
    else if (typeof b.getParser === 'function') {
      const parser = b.getParser(ua);
      rawResult = parser && (typeof parser.getResult === 'function' ? parser.getResult() : parser);
    }
  }

  // 4) last resort: try calling the module as a function
  else if (typeof bowser === 'function') {
    try {
      rawResult = bowser(ua);
    } catch (err) {
      rawResult = null;
    }
  }

  if (!rawResult) {
    // Return a predictable shape even if Bowser didn't produce a result
    return { ua, error: 'Bowser did not return a parse result', raw: rawResult };
  }

  // Bowser result shape varies by version; normalize common fields
  const browser = rawResult.browser || rawResult.client || null;
  const engine = rawResult.engine || null;
  const os = rawResult.os || null;
  const platform = rawResult.platform || null;

  // Determine device type booleans (best-effort)
  const platformType = (platform && (platform.type || platform)) || null;
  const platformJson = JSON.stringify(platform || {});
  const isMobile = /mobile/i.test(String(platformType)) || /mobile/i.test(platformJson);
  const isTablet = /tablet/i.test(String(platformType)) || /tablet/i.test(platformJson);
  const isDesktop = !isMobile && !isTablet;

  return {
    ua,
    browser: browser ? { name: browser.name || browser, version: browser.version || null } : null,
    engine: engine ? { name: engine.name || null, version: engine.version || null } : null,
    os: os ? { name: os.name || null, version: os.version || null } : null,
    platform: platform ? platform : null,
    device: {
      type: platformType || null,
      isMobile,
      isTablet,
      isDesktop
    },
    raw: rawResult
  };
}

module.exports = { parseUserAgentBowser };
