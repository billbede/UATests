const DeviceDetector = require('device-detector-js');

// Create a single detector instance to reuse across calls
const detector = new DeviceDetector();

/**
 * Call device-detector-js and return the raw parse result exactly as the library
 * provides it. No normalization, no extra fields.
 *
 * Returned shape: { ua: string, raw: <device-detector-result-or-null> }
 */
function parseUserAgentDeviceDetector(uaString) {
  const ua = uaString || '';
  let raw = null;

  try {
    // detector.parse returns an object with client, os, device, bot, etc.
    raw = detector.parse(ua);
  } catch (e) {
    raw = null;
  }

  return {
    ua,
    raw
  };
}

module.exports = { parseUserAgentDeviceDetector };
