let mod;
try {
  mod = require('express-useragent');
} catch (e) {
  throw new Error('express-useragent is not installed. Run: npm install express-useragent');
}

/**
 * Build a parse function that accepts a UA string and returns the parsed result.
 * This mirrors common export shapes but does not normalize or augment the output.
 * Returned parseFn must be synchronous (express-useragent middleware is synchronous).
 */
function buildParseFn(moduleExport) {
  // 1. direct parse function
  if (moduleExport && typeof moduleExport.parse === 'function') {
    return ua => moduleExport.parse(ua || '');
  }

  // 2. default export with parse
  if (moduleExport && moduleExport.default && typeof moduleExport.default.parse === 'function') {
    return ua => moduleExport.default.parse(ua || '');
  }

  // 3. module itself is a parse function
  if (typeof moduleExport === 'function' && moduleExport.length === 1) {
    return ua => moduleExport(ua || '');
  }

  // 4. module exposes an express middleware factory (common)
  //    try to create middleware and run it against a fake request
  const mwFactoryCandidates = [
    moduleExport && moduleExport.express,
    moduleExport && moduleExport.default && moduleExport.default.express,
    moduleExport,
    moduleExport && moduleExport.default
  ].filter(Boolean);

  for (const factory of mwFactoryCandidates) {
    if (typeof factory === 'function') {
      try {
        const mw = factory(); // create middleware
        if (typeof mw === 'function') {
          return ua => {
            const fakeReq = { headers: { 'user-agent': ua || '' }, useragent: null, ua: null };
            const fakeRes = {};
            const next = () => {};
            try {
              mw(fakeReq, fakeRes, next);
            } catch (err) {
              // ignore middleware errors
            }
            // return exactly what middleware put on the request (or undefined)
            return fakeReq.useragent || fakeReq.ua || null;
          };
        }
      } catch (err) {
        // factory failed, try next candidate
      }
    }
  }

  // 5. no usable parse function found
  return null;
}

const parseFn = buildParseFn(mod);

/**
 * Call express-useragent using library-specific shapes and return the raw value
 * the library produces, without any mapping, in a prettifiable structure:
 * { ua: string, raw: <express-useragent-result-or-null> }
 */
function parseUserAgentExpressUseragent(uaString) {
  if (!parseFn) {
    throw new Error('express-useragent parse function not available');
  }

  const ua = uaString || '';
  let raw = null;

  try {
    raw = parseFn(ua);
  } catch (e) {
    // on error, preserve null so callers can inspect failure
    raw = null;
  }

  return { ua, raw };
}

module.exports = { parseUserAgentExpressUseragent };
