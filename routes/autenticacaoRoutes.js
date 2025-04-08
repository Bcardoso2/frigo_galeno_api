// routes/autenticacaoRoutes.js
const express = require('express');
const { login, getMe } = require('../controllers/autenticacaoController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;