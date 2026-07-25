const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Wasm asset support
config.resolver.assetExts.push('wasm');

// Add COEP and COOP headers to support SharedArrayBuffer
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      return middleware(req, res, next);
    };
  }
};

module.exports = config;
