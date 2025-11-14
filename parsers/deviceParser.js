let deviceModule;
try {
  deviceModule = require('device');
} catch (e) {
  throw new Error('device is not installed. Run: npm install device');
}

/**
 * Call the device module using common export shapes and return the raw parse result
 * exactly as the module provides it. No normalization, no heuristics, no extra fields.
 *
 * Returned shape: { ua: string, raw: <device-module-result-or-null> }
 */
function parseUserAgentDevice(uaString) {
  const ua = uaString || '';
  let raw = null;

  try {
    // Common shape: device(ua)
    if (typeof deviceModule === 'function') {
      raw = deviceModule(ua);
    }

    // Default-export function: device.default(ua)
    if (!raw && deviceModule && typeof deviceModule.default === 'function') {
      raw = deviceModule.default(ua);
    }

    // Named helper shapes: detect/parse
    if (!raw && deviceModule && typeof deviceModule.detect === 'function') {
      raw = deviceModule.detect(ua);
    }
    if (!raw && deviceModule && typeof deviceModule.parse === 'function') {
      raw = deviceModule.parse(ua);
    }

    // If module exported an object that already looks like a result, return it (last resort)
    if (!raw && deviceModule && typeof deviceModule === 'object') {
      raw = deviceModule;
    }
  } catch (err) {
    // On error, return null raw so callers can inspect failure
    raw = null;
  }

  return {
    ua,
    raw
  };
}

module.exports = { parseUserAgentDevice };
