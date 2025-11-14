let mod;
try {
  mod = require('express-useragent');
} catch (e) {
  throw new Error('express-useragent is not installed. Run: npm install express-useragent');
}

const BOT_RE = /\b(bot|crawler|spider|crawl|slurp|fetch|mediapartners|pingdom|statuscake|uptime|monitor|scanner|archiver|validator|preview|transcoder)\b/i;

function splitVersion(version) {
  if (!version || typeof version !== 'string') return { raw: version || null, major: null, minor: null, patch: null };
  const parts = version.split('.').map(p => p || null);
  return { raw: version, major: parts[0] || null, minor: parts[1] || null, patch: parts[2] || null };
}

/**
 * Build a parse function that accepts a UA string and returns the parsed result.
 * Handles common export shapes for express-useragent: module.parse, default.parse,
 * module() middleware factory, or direct function.
 */
function buildParseFn(moduleExport) {
  // 1. direct parse function
  if (moduleExport && typeof moduleExport.parse === 'function') {
    return ua => moduleExport.parse(ua || '');
  }

  // 2. default export with parse
  if (moduleExport && moduleExport.default && typeof moduleExport.default.parse === 'function') {
    return ua => moduleExport.default.parse(ua || '');
  }

  // 3. module itself is a parse function (rare)
  if (typeof moduleExport === 'function' && moduleExport.length === 1) {
    return ua => moduleExport(ua || '');
  }

  // 4. module exposes an express middleware factory (common)
  const mwFactoryCandidates = [
    moduleExport && moduleExport.express,
    moduleExport && moduleExport.default && moduleExport.default.express,
    moduleExport,
    moduleExport && moduleExport.default
  ].filter(Boolean);

  for (const factory of mwFactoryCandidates) {
    if (typeof factory === 'function') {
      try {
        const mw = factory(); // create middleware
        if (typeof mw === 'function') {
          return ua => {
            const fakeReq = { headers: { 'user-agent': ua || '' }, useragent: null };
            const fakeRes = {};
            const next = () => {};
            try {
              mw(fakeReq, fakeRes, next);
            } catch (err) {
              // ignore middleware errors; middleware is synchronous in practice
            }
            // middleware sets fakeReq.useragent or returns an object
            return fakeReq.useragent || fakeReq.ua || {};
          };
        }
      } catch (err) {
        // try next candidate
      }
    }
  }

  // 5. no usable parse function found
  return null;
}

const parseFn = buildParseFn(mod);

/**
 * Map express-useragent result to an expanded normalized shape.
 *
 * express-useragent typical result fields:
 * { source, ua, browser, version, os, platform, isMobile, isTablet, isDesktop, isBot, vendor, model }
 */
function normalizeResult(raw, inputUa) {
  const r = raw || {};
  const ua = String(r.source || r.ua || inputUa || '');

  // browser/name/version normalization
  const browserName = r.browser || (r.browser && r.browser.name) || null;
  const browserVersionRaw = r.version || (r.version && String(r.version)) || null;
  const browserVersionParts = splitVersion(browserVersionRaw);

  // os/platform
  const os = r.os || null;
  const platform = r.platform || null;

  // device details
  const vendor = r.vendor || null;
  const model = r.model || null;

  // booleans (express-useragent may provide them already)
  const isMobile = Boolean(r.isMobile) || /\b(mobile|iphone|ipod|android.*mobile|windows phone|bb10)\b/i.test(ua);
  const isTablet = Boolean(r.isTablet) || /\b(ipad|tablet|nexus 7|sm-t|kindle|playbook)\b/i.test(ua);
  const isDesktop = Boolean(r.isDesktop) || (!isMobile && !isTablet && !Boolean(r.isBot));
  const isBot = Boolean(r.isBot) || BOT_RE.test(ua) || /\b(bot|crawler|spider|crawl|slurp)\b/i.test(String(r.browser || ''));

  // deviceCategory: phone|tablet|desktop|bot|other
  let deviceCategory = 'desktop';
  if (isBot) deviceCategory = 'bot';
  else if (isTablet) deviceCategory = 'tablet';
  else if (isMobile) deviceCategory = 'phone';
  else if (isDesktop) deviceCategory = 'desktop';
  else deviceCategory = 'other';

  // engine inference from source (best-effort)
  const engineMatch = /\b(AppleWebKit|Gecko|Trident|Presto|Blink|EdgeHTML)\/?([0-9\.]*)/i.exec(ua || '');
  const engine = engineMatch ? { name: engineMatch[1], version: engineMatch[2] || null, versionParts: splitVersion(engineMatch[2] || null) } : { name: null, version: null, versionParts: splitVersion(null) };

  return {
    ua,
    browser: {
      name: browserName || null,
      version: browserVersionRaw || null,
      versionParts: browserVersionParts
    },
    os: os || null,
    platform: platform || null,
    device: {
      vendor,
      model,
      isMobile,
      isTablet,
      isDesktop
    },
    engine,
    isMobile,
    isTablet,
    isDesktop,
    isBot,
    deviceCategory,
    source: r.source || r.ua || null,
    raw: r
  };
}

function parseUserAgentExpressUseragent(uaString) {
  if (!parseFn) {
    throw new Error('express-useragent parse function not available');
  }

  const raw = parseFn(uaString || '') || {};
  return normalizeResult(raw, uaString || '');
}

module.exports = { parseUserAgentExpressUseragent };
