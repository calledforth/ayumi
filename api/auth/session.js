const { applyCors, handleOptions, sendJson } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  sendJson(res, 501, {
    error: 'Auth session endpoints are planned but not implemented yet.',
    hint: 'Use this route for future login/session bootstrap through Vercel.',
  });
};
