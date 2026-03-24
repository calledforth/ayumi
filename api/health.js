const { applyCors, handleOptions, sendJson } = require('./_lib/http');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  sendJson(res, 200, {
    ok: true,
    service: 'ayumi-api',
    timestamp: new Date().toISOString(),
  });
};
