let bowser;
try {
  bowser = require('bowser');
} catch (e) {
  throw new Error('bowser is not installed. Run: npm install bowser');
}

/**
 * Call Bowser using several common export shapes and return the raw parse result
 * exactly as the library provides it. No normalization, no extra fields.
 *
 * Returned shape: { ua: string, raw: <bowser-result-or-null> }
 */
function parseUserAgentBowser(uaString) {
  const ua = uaString || '';
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

  // 4) last resort: call module as a function
  if (!rawResult && typeof bowser === 'function') {
    try { rawResult = bowser(ua); } catch (e) { rawResult = null; }
  }

  // Return the raw result exactly as received from Bowser
  return {
    ua,
    raw: rawResult
  };
}

module.exports = { parseUserAgentBowser };
