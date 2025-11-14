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

/**
 * Call detect-browser in the most compatible ways and return the raw value
 * produced by the library, without any mapping or inference.
 *
 * Returned shape: { ua: string, raw: <detect-browser-result-or-null> }
 */
function parseUserAgentDetectBrowser(uaString) {
  if (!detectFn) {
    throw new Error('detect-browser detect function not available');
  }

  const ua = uaString || '';
  let raw = null;

  try {
    // Prefer calling with the UA string if supported
    raw = detectFn.length >= 1 ? detectFn(ua) : detectFn();
  } catch (e) {
    // If the primary call failed, try common alternative exports
    try {
      if (detectModule && typeof detectModule.detect === 'function') raw = detectModule.detect(ua);
      else if (detectModule && detectModule.default && typeof detectModule.default.detect === 'function') raw = detectModule.default.detect(ua);
      else if (typeof detectModule.parseUserAgent === 'function') raw = detectModule.parseUserAgent(ua);
      else if (typeof detectModule === 'function') raw = detectModule(ua);
      else raw = null;
    } catch (ee) {
      raw = null;
    }
  }

  // Return exactly what the library returned (or null) so callers can stringify it themselves
  return {
    ua,
    raw
  };
}

module.exports = { parseUserAgentDetectBrowser };
