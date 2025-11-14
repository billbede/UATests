let deviceModule;
try {
  deviceModule = require('device');
} catch (e) {
  throw new Error('device is not installed. Run: npm install device');
}

/**
 * Normalize the device module result into a compact, consistent shape.
 * The device module can expose a function that accepts a UA string and returns
 * an object. We handle a few common export shapes and return a predictable
 * shape even if some fields are missing.
 *
 * @param {string} uaString
 * @returns {object}
 */
function parseUserAgent(uaString) {


  var device = require('device');
var mydevice = device(uaString);
 





  const ua = uaString || '';

  // Try calling the module in a few common ways
  let raw = null;

  // 1) module is a function: device(ua)
  if (typeof deviceModule === 'function') {
    try {
      raw = deviceModule(ua);
    } catch (err) {
      raw = null;
    }
  }

  // 2) module has default export that's a function
  else if (deviceModule && typeof deviceModule.default === 'function') {
    try {
      raw = deviceModule.default(ua);
    } catch (err) {
      raw = null;
    }
  }

  // If no result, return predictable shape
  if (!raw || typeof raw !== 'object') {
    return {
      ua,
      name: null,
      type: null,
      vendor: null,
      model: null,
      os: null,
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      raw: raw
    };
  }

  // Common field names the device module may use (best-effort)
  // Try to extract sensible values from raw result
  const name = raw.name || raw.device || raw.model || null;
  const type = raw.type || raw.deviceType || (raw.isMobile ? 'mobile' : null) || null;
  const vendor = raw.vendor || raw.manufacturer || null;
  const model = raw.model || raw.brand || null;
  const os = raw.os || raw.osName || raw.operatingSystem || null;

  // Heuristics for device category
  const isMobile = Boolean(
    raw.isMobile ||
    /mobile/i.test(String(type || '')) ||
    /phone/i.test(String(name || '')) ||
    /iphone|android/i.test(String(ua))
  );

  const isTablet = Boolean(
    raw.isTablet ||
    /tablet/i.test(String(type || '')) ||
    /ipad|tablet/i.test(String(ua))
  );

  const isDesktop = !isMobile && !isTablet;

  return {
    ua,
    name,
    type,
    vendor,
    model,
    os,
    isMobile,
    isTablet,
    isDesktop,
    raw
  };
}

module.exports = { parseUserAgent };
