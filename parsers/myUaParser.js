let provider = null;
let providerName = null;

try {
  provider = require('my-ua-parser');
  providerName = 'my-ua-parser';
} catch (e) {
  // fallback to ua-parser-js which is widely available and has a stable API
  provider = require('ua-parser-js');
  providerName = 'ua-parser-js';
}

const BOT_RE = /\b(bot|crawler|spider|crawl|slurp|fetch|mediapartners|pingdom|statuscake|uptime|monitor|scanner|archiver|validator|preview|transcoder)\b/i;

function splitVersion(version) {
  if (!version || typeof version !== 'string') return { raw: version || null, major: null, minor: null, patch: null };
  const parts = version.split('.').map(p => p || null);
  return { raw: version, major: parts[0] || null, minor: parts[1] || null, patch: parts[2] || null };
}

function inferEngineFromUA(ua) {
  const m = /\b(AppleWebKit|Gecko|Trident|Presto|Blink|EdgeHTML)\/?([0-9\.]*)/i.exec(ua || '');
  if (!m) return { name: null, version: null, versionParts: splitVersion(null) };
  return { name: m[1], version: m[2] || null, versionParts: splitVersion(m[2] || null) };
}

function classifyDeviceType(parsedDevice, ua) {
  // Accept explicit device.type if present (normalize)
  const explicit = parsedDevice && parsedDevice.type ? String(parsedDevice.type).toLowerCase() : null;
  if (explicit === 'mobile') return 'phone';
  if (explicit === 'tablet') return 'tablet';
  if (explicit === 'smarttv' || explicit === 'console' || explicit === 'wearable' || explicit === 'embedded' || explicit === 'xr')
    return explicit;

  // UA heuristics fallback
  if (/\b(bot|crawler|spider|fetch|slurp|archiver)\b/i.test(ua)) return 'bot';
  if (/\b(ipad|tablet|nexus 7|nexus 9|sm-t|gt-p|kindle|playbook)\b/i.test(ua)) return 'tablet';
  if (/\b(mobile|iphone|ipod|android.*mobile|windows phone|blackberry|bb10)\b/i.test(ua)) return 'phone';

  // default to desktop
  return 'desktop';
}

/**
 * Parse a UA string using either my-ua-parser (if installed) or ua-parser-js fallback,
 * and return a rich normalized shape with originals, parsed breakdowns, flags and heuristics.
 *
 * The wrapper is defensive about provider shapes:
 * - If provider behaves like ua-parser-js (constructor returning .getResult()) we use that.
 * - If provider exposes a function that returns a result object, we call it.
 * - If provider exports an object with .parse or .getResult, we try to use those.
 */
function parseUserAgentMyUaParser(uaString) {
  const ua = uaString || '';
  let rawResult = null;
  let usedProvider = providerName;

  // Try multiple calling conventions safely
  try {
    // provider is a function that returns a result or is a constructor
    if (typeof provider === 'function') {
      // If it looks like a constructor (has prototype methods) attempt `new`
      if (provider.prototype && Object.keys(provider.prototype).length > 0) {
        try {
          const inst = new provider(ua);
          rawResult = inst && (typeof inst.getResult === 'function' ? inst.getResult() : (typeof inst.parse === 'function' ? inst.parse(ua) : inst));
        } catch (e) {
          // if constructor fails, try calling as factory
          const inst2 = provider(ua);
          rawResult = inst2 && (typeof inst2.getResult === 'function' ? inst2.getResult() : (typeof inst2.parse === 'function' ? inst2.parse(ua) : inst2));
        }
      } else {
        const out = provider(ua);
        rawResult = out && (typeof out.getResult === 'function' ? out.getResult() : (typeof out.parse === 'function' ? out.parse(ua) : out));
      }
    }
    // provider exports UAParser-like class/constructor
    else if (provider && typeof provider.UAParser === 'function') {
      const inst = new provider.UAParser(ua);
      rawResult = inst && (typeof inst.getResult === 'function' ? inst.getResult() : inst);
    }
    // provider has parse/getResult as methods on the export
    else if (provider && typeof provider.parse === 'function') {
      rawResult = provider.parse(ua);
    } else if (provider && typeof provider.getResult === 'function') {
      rawResult = provider.getResult(ua);
    } else if (provider && provider.default) {
      // try default export shapes
      const p = provider.default;
      if (typeof p === 'function') {
        const out = p(ua);
        rawResult = out && (typeof out.getResult === 'function' ? out.getResult() : (typeof out.parse === 'function' ? out.parse(ua) : out));
      } else if (typeof p.parse === 'function') {
        rawResult = p.parse(ua);
      }
    }
  } catch (err) {
    // on any error, fallback to ua-parser-js explicitly if not already using it
    if (providerName !== 'ua-parser-js') {
      try {
        const UAParser = require('ua-parser-js');
        rawResult = new UAParser(ua).getResult();
        usedProvider = 'ua-parser-js';
      } catch (e) {
        rawResult = null;
      }
    } else {
      rawResult = null;
    }
  }

  // Final fallback: if rawResult is still null and providerName was ua-parser-js,
  // ensure we attempted ua-parser-js parsing
  if (!rawResult && usedProvider === 'ua-parser-js') {
    try {
      const UAParser = require('ua-parser-js');
      rawResult = new UAParser(ua).getResult();
    } catch (e) {
      rawResult = null;
    }
  }

  rawResult = rawResult || {};

  // Normalize common fields (best-effort mapping)
  const browser = rawResult.browser || rawResult.client || rawResult.agent || rawResult.userAgent || null;
  const engine = rawResult.engine || null;
  const os = rawResult.os || rawResult.operatingSystem || rawResult.osName || null;
  const device = rawResult.device || rawResult.clientDevice || null;
  const cpu = rawResult.cpu || null;

  // Browser/version normalization
  const bname = browser && (browser.name || browser.family || browser.browser) ? (browser.name || browser.family || browser.browser) : null;
  const bver = browser && (browser.version || browser.major || browser.fullVersion) ? (browser.version || [browser.major, browser.minor, browser.patch].filter(Boolean).join('.') || browser.fullVersion) : null;
  const browserVersionParts = splitVersion(bver);

  // OS normalization
  const osName = os && (os.name || os.family || os.os) ? (os.name || os.family || os.os) : null;
  const osVersionRaw = os && (os.version || os.major || os.fullVersion) ? (os.version || [os.major, os.minor, os.patch].filter(Boolean).join('.') || os.fullVersion) : null;
  const osVersionParts = splitVersion(osVersionRaw);

  // Device normalization
  const deviceVendor = device && (device.vendor || device.brand || device.manufacturer) ? (device.vendor || device.brand || device.manufacturer) : null;
  const deviceModel = device && (device.model || device.name) ? (device.model || device.name) : null;
  const deviceTypeRaw = device && (device.type || device.deviceType) ? (device.type || device.deviceType) : null;
  const deviceCategory = classifyDeviceType(device || {}, ua);

  // Engine inference if provider didn't provide
  const engineObj = engine && (engine.name || engine.version) ? engine : inferEngineFromUA(ua);

  // Bot detection
  const maybeBot = Boolean(
    (browser && (browser.name && /\b(bot|crawler|spider)\b/i.test(String(browser.name)))) ||
    BOT_RE.test(ua) ||
    (deviceCategory === 'bot')
  );

  // boolean flags
  const isMobile = deviceCategory === 'phone' || /\b(mobile|iphone|ipod|android.*mobile|windows phone)\b/i.test(ua);
  const isTablet = deviceCategory === 'tablet' || /\b(ipad|tablet|nexus 7|sm-t)\b/i.test(ua);
  const isDesktop = !isMobile && !isTablet && !maybeBot;

  return {
    ua,
    provider: usedProvider,
    // browser normalized
    browser: {
      name: bname,
      version: bver || null,
      versionParts: browserVersionParts,
      raw: browser || null
    },
    // engine
    engine: {
      name: engineObj.name || null,
      version: engineObj.version || null,
      versionParts: splitVersion(engineObj.version)
    },
    // os
    os: {
      name: osName,
      version: osVersionRaw,
      versionParts: osVersionParts,
      raw: os || null
    },
    // device
    device: {
      vendor: deviceVendor,
      model: deviceModel,
      type: deviceTypeRaw || null,
      category: deviceCategory, // phone|tablet|desktop|bot|smarttv|...
      raw: device || null
    },
    cpu: {
      architecture: cpu && cpu.architecture ? cpu.architecture : null,
      raw: cpu || null
    },
    // flags and category
    isBot: maybeBot,
    isMobile,
    isTablet,
    isDesktop,
    // include full provider raw result for debugging
    raw: rawResult
  };
}

module.exports = { parseUserAgentMyUaParser };
