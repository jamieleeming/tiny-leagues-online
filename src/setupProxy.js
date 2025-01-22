const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://www.pokernow.club',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding to target
      },
    })
  );
}; 