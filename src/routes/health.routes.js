const express = require('express');
const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'alerta-evasao-api', version: '1.0.0' });
});

module.exports = router;
