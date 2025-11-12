const DeviceDetector = require('device-detector-js');

// Create a single detector instance to reuse across calls
const detector = new DeviceDetector();

/**
 * Parse a UA string using device-detector-js and return a normalized object.
 * @param {string} uaString
 * @returns {object}
 */
function parseUserAgentDeviceDetector(uaString) {
  const ua = uaString || '';
  const result = detector.parse(ua);

  // Normalize into a compact, consistent shape
  return {
    ua,
    client: result.client || null,    // { type, name, version }
    os: result.os || null,            // { name, version }
    device: result.device || null,    // { type, brand, model }
    bot: result.bot || null,          // bot info if detected
    raw: result                        // full provider result for inspection
  };
}

module.exports = { parseUserAgentDeviceDetector };
