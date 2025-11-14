const UAParser = require('ua-parser-js');

// Parse a UA string using ua-parser-js
function parseUserAgentUAParser(userAgent) {
  const parser = new UAParser(userAgent || '');
  const result = parser.getResult();

  // Return a compact, consistent shape
  return {
    ua: result.ua,
    browser: result.browser,    // { name, version, major }
    engine: result.engine,      // { name, version }
    os: result.os,              // { name, version }
    device: result.device,      // { vendor, model, type }
    cpu: result.cpu             // { architecture }
  };
}

module.exports = { parseUserAgentUAParser };
