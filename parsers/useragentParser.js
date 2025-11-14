const useragent = require('useragent');

/**
 * Call useragent.parse and return the raw objects the library produces.
 * No normalization, no heuristics, no extra fields.
 *
 * Returned shape: { ua: string, raw: { agent, os, device } } (any part may be null)
 */
function parseUserAgentUseragent(uaString) {
  const ua = uaString || '';
  let agent = null;
  let os = null;
  let device = null;

  try {
    const parsed = useragent.parse(ua);
    // useragent.parse returns an Agent instance with .toString/.toAgent and properties
    agent = parsed || null;
    os = parsed && parsed.os ? parsed.os : null;
    device = parsed && parsed.device ? parsed.device : null;
  } catch (e) {
    // preserve nulls on error so callers can inspect failure
    agent = null;
    os = null;
    device = null;
  }

  return {
    ua,
    raw: {
      agent,
      os,
      device
    }
  };
}

module.exports = { parseUserAgentUseragent };
