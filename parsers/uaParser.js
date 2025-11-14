const UAParser = require('ua-parser-js');

/**
 * Call ua-parser-js and return its raw parse result exactly as the library
 * provides it. No normalization, no extra fields.
 *
 * Returned shape: { ua: string, raw: <ua-parser-js-result-or-null> }
 */
function parseUserAgentUAParser(userAgent) {
  const ua = userAgent || '';
  let raw = null;

  try {
    // UAParser can be used as a constructor taking the UA string
    const parser = new UAParser(ua);
    raw = typeof parser.getResult === 'function' ? parser.getResult() : parser;
  } catch (e) {
    // On error preserve null so callers can inspect failure
    raw = null;
  }

  return { ua, raw };
}

module.exports = { parseUserAgentUAParser };
