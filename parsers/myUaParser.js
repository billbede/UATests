let provider = null;
let providerName = null;

try {
  provider = require('my-ua-parser');
  providerName = 'my-ua-parser';
} catch (e) {
  // fallback to ua-parser-js which is widely available and has a stable API
  provider = require('ua-parser-js');
  providerName = 'ua-parser-js';
}

/**
 * Call the installed provider in the most compatible ways and return the raw
 * value produced by the library, without any mapping, inference, or added fields.
 *
 * Returned shape: { ua: string, provider: 'my-ua-parser'|'ua-parser-js', raw: <provider-result-or-null> }
 */
function parseUserAgentMyUaParser(uaString) {
  const ua = uaString || '';
  let raw = null;
  let used = providerName;

  try {
    // If provider is a function: constructor, factory or direct parser
    if (typeof provider === 'function') {
      // Try constructor-like `new provider(ua)` first if it appears to have prototype methods
      if (provider.prototype && Object.keys(provider.prototype).length > 0) {
        try {
          const inst = new provider(ua);
          raw = inst && (typeof inst.getResult === 'function' ? inst.getResult() : (typeof inst.parse === 'function' ? inst.parse(ua) : inst));
        } catch (err) {
          // constructor failed — try calling as factory
          const out = provider(ua);
          raw = out && (typeof out.getResult === 'function' ? out.getResult() : (typeof out.parse === 'function' ? out.parse(ua) : out));
        }
      } else {
        // factory or direct-call shape
        const out = provider(ua);
        raw = out && (typeof out.getResult === 'function' ? out.getResult() : (typeof out.parse === 'function' ? out.parse(ua) : out));
      }
    }
    // If provider exports UAParser-like class/constructor as property
    else if (provider && typeof provider.UAParser === 'function') {
      const inst = new provider.UAParser(ua);
      raw = inst && (typeof inst.getResult === 'function' ? inst.getResult() : inst);
    }
    // If provider exposes parse/getResult directly on the export
    else if (provider && typeof provider.parse === 'function') {
      raw = provider.parse(ua);
    } else if (provider && typeof provider.getResult === 'function') {
      raw = provider.getResult(ua);
    }
    // default-export interop
    else if (provider && provider.default) {
      const p = provider.default;
      if (typeof p === 'function') {
        const out = p(ua);
        raw = out && (typeof out.getResult === 'function' ? out.getResult() : (typeof out.parse === 'function' ? out.parse(ua) : out));
      } else if (typeof p.parse === 'function') {
        raw = p.parse(ua);
      } else if (typeof p.getResult === 'function') {
        raw = p.getResult(ua);
      }
    }
  } catch (err) {
    // On error, attempt an explicit fallback to ua-parser-js if it wasn't already used
    if (used !== 'ua-parser-js') {
      try {
        const UAParser = require('ua-parser-js');
        raw = new UAParser(ua).getResult();
        used = 'ua-parser-js';
      } catch (e) {
        raw = null;
      }
    } else {
      raw = null;
    }
  }

  // Final fallback: if nothing was obtained and providerName was ua-parser-js, try one more time
  if (!raw && used === 'ua-parser-js') {
    try {
      const UAParser = require('ua-parser-js');
      raw = new UAParser(ua).getResult();
    } catch (e) {
      raw = null;
    }
  }

  return {
    ua,
    provider: used,
    raw: raw === undefined ? null : raw
  };
}

module.exports = { parseUserAgentMyUaParser };
