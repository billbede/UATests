const useragent = require('useragent');

// Parse a UA string using the useragent package and return a compact shape
function parseUserAgentUseragent(uaString) {
  const agent = useragent.parse(uaString || '');

  return {
    ua: uaString || '',
    family: agent.family,
    version: [agent.major, agent.minor, agent.patch].filter(Boolean).join('.'),
    os: agent.os ? agent.os.toString() : null,
    device: agent.device ? agent.device.toString() : null,
    source: agent.toString()
  };
}

module.exports = { parseUserAgentUseragent };
