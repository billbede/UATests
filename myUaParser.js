let provider = null;
let providerName = null;

try {
  // try the requested package first
  provider = require('my-ua-parser');
  providerName = 'my-ua-parser';
} catch (e) {
  // fallback to ua-parser-js which is widely available
  provider = require('ua-parser-js');
  providerName = 'ua-parser-js';
}

/**
 * Parse a UA string using the available provider.
 * Returns a normalized object with common fields.
 */
function parseUserAgentMyUaParser(uaString) {
  const ua = uaString || '';

  if (providerName === 'my-ua-parser') {
    // Best-effort handling for unknown provider API shapes.
    // Try common patterns: constructor, factory, or exported UAParser.
    try {
      // If provider is a constructor or factory function
      if (typeof provider === 'function') {
        const instance = (provider.prototype && Object.keys(provider.prototype).length)
          ? new provider(ua) // constructor-like
          : provider(ua);     // factory-like
        const result = instance && (instance.getResult ? instance.getResult() : (instance.parse ? instance.parse(ua) : instance));
        return normalizeResult(ua, result);
      }

      // If provider exports UAParser or similar
      if (provider && provider.UAParser) {
        const instance = new provider.UAParser(ua);
        const result = instance.getResult ? instance.getResult() : instance;
        return normalizeResult(ua, result);
      }

      // Last resort: return raw provider value
      return { ua, raw: provider };
    } catch (err) {
      // If anything goes wrong, fall back to ua-parser-js below
    }
  }

  // Fallback path using ua-parser-js
  const UAParser = provider; // provider is ua-parser-js here
  const result = new UAParser(ua).getResult();
  return normalizeResult(ua, result);
}

// Normalize different parser outputs into a compact shape
function normalizeResult(ua, result = {}) {
  return {
    ua,
    browser: result.browser || result.client || null,
    engine: result.engine || null,
    os: result.os || null,
    device: result.device || null,
    cpu: result.cpu || null,
    raw: result // include raw provider result for inspection
  };
}

module.exports = { parseUserAgentMyUaParser };
