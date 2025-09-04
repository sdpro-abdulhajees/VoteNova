const express = require('express');
const router = express.Router();
const { registerFace, verifyFace, login } = require('../controllers/authController');

router.post('/register', registerFace);
router.post('/verify', verifyFace);
router.post('/login', login);

// Simple health check for debugging route availability
router.get('/health', (req, res) => {
  res.json({ ok: true, routes: ['POST /register', 'POST /verify', 'POST /login'] });
});
router.post('/health', (req, res) => {
  res.json({ ok: true, method: 'POST', routes: ['POST /register', 'POST /verify', 'POST /login'] });
});

module.exports = router;
