let mod;
try {
  mod = require('express-useragent');
} catch (e) {
  throw new Error('express-useragent is not installed. Run: npm install express-useragent');
}

// Build a parse function that accepts a UA string and returns the parsed result
function buildParseFn(moduleExport) {
  // 1. direct parse function
  if (moduleExport && typeof moduleExport.parse === 'function') {
    return ua => moduleExport.parse(ua || '');
  }

  // 2. default export with parse
  if (moduleExport && moduleExport.default && typeof moduleExport.default.parse === 'function') {
    return ua => moduleExport.default.parse(ua || '');
  }

  // 3. module itself is a parse function (rare)
  if (typeof moduleExport === 'function' && moduleExport.length === 1) {
    // try calling it directly with UA string
    return ua => moduleExport(ua || '');
  }

  // 4. module exposes an express middleware factory (common)
  //    e.g. module.express() or module() returns middleware (req, res, next)
  const mwFactoryCandidates = [
    moduleExport && moduleExport.express,
    moduleExport && moduleExport.default && moduleExport.default.express,
    moduleExport, // sometimes the module itself is the factory
    moduleExport && moduleExport.default // or default is the factory
  ].filter(Boolean);

  for (const factory of mwFactoryCandidates) {
    if (typeof factory === 'function') {
      try {
        const mw = factory(); // create middleware
        if (typeof mw === 'function') {
          // return a function that runs the middleware on a fake req
          return ua => {
            const fakeReq = { headers: { 'user-agent': ua || '' }, useragent: null };
            const fakeRes = {};
            // middleware may be sync or async; handle both
            let called = false;
            const next = () => { called = true; };
            try {
              const maybePromise = mw(fakeReq, fakeRes, next);
              if (maybePromise && typeof maybePromise.then === 'function') {
                // middleware returned a promise; wait synchronously is not possible here,
                // but express-useragent middleware is synchronous, so this is just a safeguard.
              }
            } catch (err) {
              // ignore middleware errors and return whatever was set on fakeReq
            }
            // middleware should have set fakeReq.useragent
            return fakeReq.useragent || {};
          };
        }
      } catch (err) {
        // factory invocation failed, try next candidate
      }
    }
  }

  // 5. no usable parse function found
  return null;
}

const parseFn = buildParseFn(mod);

function parseUserAgentExpressUseragent(uaString) {
  if (!parseFn) {
    throw new Error('express-useragent parse function not available');
  }

  const raw = parseFn(uaString || '');

  // express-useragent returns an object with fields like:
  // { source, ua, browser, version, os, platform, isMobile, isTablet, isDesktop, vendor, model }
  const result = raw || {};

  return {
    ua: result.source || uaString || '',
    browser: { name: result.browser || null, version: result.version || null },
    os: result.os || null,
    platform: result.platform || null,
    device: {
      isMobile: !!result.isMobile,
      isTablet: !!result.isTablet,
      isDesktop: !!result.isDesktop,
      vendor: result.vendor || null,
      model: result.model || null
    },
    source: result.source || null,
    raw: result
  };
}

module.exports = { parseUserAgentExpressUseragent };
