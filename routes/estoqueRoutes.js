// routes/estoqueRoutes.js
const express = require('express');
const {
  atualizarEstoque,
  listarEstoque,
  getEstoqueProduto,
  getProdutosDisponiveis
} = require('../controllers/estoqueController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// // Proteger todas as rotas
// router.use(protect);

// Rotas que não precisam de autorização admin
router.get('/', listarEstoque);
router.get('/disponiveis', getProdutosDisponiveis);
router.get('/:produtoId', getEstoqueProduto);

// Rotas que precisam de autorização admin
router.put('/:produtoId', authorize('admin'), atualizarEstoque);

module.exports = router;