let detectModule;
try {
  detectModule = require('detect-browser');
} catch (e) {
  throw new Error('detect-browser is not installed. Run: npm install detect-browser');
}

function resolveDetectFn(mod) {
  if (!mod) return null;
  if (typeof mod.detect === 'function') return mod.detect;
  if (mod && typeof mod.default === 'function') return mod.default;
  if (mod && mod.default && typeof mod.default.detect === 'function') return mod.default.detect;
  if (typeof mod === 'function') return mod;
  return null;
}

const detectFn = resolveDetectFn(detectModule);

function parseUserAgentDetectBrowser(uaString) {
  if (!detectFn) {
    throw new Error('detect-browser detect function not available');
  }

  const ua = uaString || '';
  // detectFn returns an object like { name, version, os } or null if unknown
  const raw = detectFn(ua);

  return {
    ua,
    name: raw && raw.name ? raw.name : null,
    version: raw && raw.version ? raw.version : null,
    os: raw && raw.os ? raw.os : null,
    raw
  };
}

module.exports = { parseUserAgentDetectBrowser };
