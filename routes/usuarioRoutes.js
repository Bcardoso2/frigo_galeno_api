// routes/usuarioRoutes.js
const express = require('express');
const {
  criarUsuario,
  listarUsuarios,
  getUsuario,
  atualizarUsuario,
  alterarStatusUsuario
} = require('../controllers/usuarioController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Proteger todas as rotas
router.use(protect);
// Permitir apenas para admin
router.use(authorize('admin'));

router.route('/')
  .get(listarUsuarios)
  .post(criarUsuario);

router.route('/:id')
  .get(getUsuario)
  .put(atualizarUsuario);

router.put('/:id/status', alterarStatusUsuario);

module.exports = router;