function sendJson(res, status, body) {
  res.status(status).json(body);
}

function getAllowedOrigin(origin) {
  const envList = process.env.ALLOWED_ORIGINS ?? '';
  const configured = envList
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!origin) return '*';
  if (configured.length === 0) return '*';
  return configured.includes(origin) ? origin : configured[0];
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', getAllowedOrigin(origin));
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-version');
}

function handleOptions(req, res) {
  if (req.method !== 'OPTIONS') return false;
  applyCors(req, res);
  res.status(204).end();
  return true;
}

module.exports = { sendJson, applyCors, handleOptions };
