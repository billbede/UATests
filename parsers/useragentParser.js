const useragent = require('useragent');

const BOT_RE = /\b(bot|crawler|spider|crawl|slurp|fetch|mediapartners|pingdom|statuscake|uptime|monitor|scanner|archiver|validator|preview|transcoder)\b/i;

function splitVersion(version) {
  if (!version || typeof version !== 'string') return { raw: version || null, major: null, minor: null, patch: null };
  const parts = version.split('.').map(p => p || null);
  return { raw: version, major: parts[0] || null, minor: parts[1] || null, patch: parts[2] || null };
}

/**
 * Parse a UA string using the `useragent` package and return an expanded shape
 * with raw, normalized, and convenience fields (versions split, booleans, bot detection).
 *
 * @param {string} uaString
 * @returns {object}
 */
function parseUserAgentUseragent(uaString) {
  const ua = uaString || '';
  const agent = useragent.parse(ua);

  // Primary browser fields
  const family = agent.family || null;
  const rawVersion = [agent.major, agent.minor, agent.patch].filter(Boolean).join('.') || null;
  const versionParts = splitVersion(rawVersion);

  // OS and device objects (agent.os and agent.device are objects provided by the library)
  const osObj = agent.os || {};
  const deviceObj = agent.device || {};

  // Derived strings
  const osString = osObj && typeof osObj.toString === 'function' ? osObj.toString() : (osObj && (osObj.family || osObj.toString) ? String(osObj) : null);
  const deviceString = deviceObj && typeof deviceObj.toString === 'function' ? deviceObj.toString() : (deviceObj && (deviceObj.family || deviceObj.toString) ? String(deviceObj) : null);
  const source = agent.toString ? agent.toString() : null;
  const toAgent = agent.toAgent ? agent.toAgent() : null; // sometimes available

  // Engine best-effort: useragent doesn't expose engine separately; attempt to infer from family/version or source
  let engine = { name: null, version: null, versionParts: { raw: null, major: null, minor: null, patch: null } };
  const engineMatch = /\b(AppleWebKit|Gecko|Trident|Presto|Blink|EdgeHTML)\/?([0-9\.]*)/i.exec(source || '');
  if (engineMatch) {
    engine.name = engineMatch[1];
    engine.version = engineMatch[2] || null;
    engine.versionParts = splitVersion(engine.version);
  }

  // Bot detection (prefer explicit family hint, then UA regex)
  const maybeBotFromFamily = family && /\b(bot|crawler|spider|fetch|slurp|archiver)\b/i.test(family);
  const isBot = Boolean(maybeBotFromFamily || BOT_RE.test(ua) || /\b(Bot|Crawler|Spider)\b/i.test(source || ''));

  // Device category heuristics
  // useragent.device.family may be like "Other", "iPhone", etc.
  const deviceFamily = (deviceObj && (deviceObj.family || deviceObj.device || deviceObj.model)) ? String(deviceObj.family || deviceObj.device || deviceObj.model) : null;
  const isTablet = Boolean(/ipad|tablet|nexus 7|nexus 9|sm-t/i.test(ua) || /tablet/i.test(deviceFamily || ''));
  const isMobile = Boolean(/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua) || /iphone|android|phone|mobile/i.test(deviceFamily || ''));
  const isDesktop = !isMobile && !isTablet && !isBot;

  // Normalized structured output
  return {
    ua,
    // browser / agent
    family,
    version: rawVersion,
    versionParts,
    toAgent,
    source,

    // os
    os: {
      family: osObj.family || null,
      major: osObj.major || null,
      minor: osObj.minor || null,
      patch: osObj.patch || null,
      toString: osString
    },

    // device
    device: {
      family: deviceObj.family || null,
      brand: deviceObj.brand || deviceObj.vendor || null,
      model: deviceObj.model || null,
      toString: deviceString,
      raw: deviceObj
    },

    // inferred engine
    engine,

    // flags and normalized category
    isBot,
    isMobile,
    isTablet,
    isDesktop,
    deviceCategory: isBot ? 'bot' : (isMobile ? 'phone' : (isTablet ? 'tablet' : 'desktop')),

    // full agent object for debugging
    raw: {
      agent,
      os: osObj,
      device: deviceObj
    }
  };
}

module.exports = { parseUserAgentUseragent };
