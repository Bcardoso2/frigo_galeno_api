// routes/produtoRoutes.js
const express = require('express');
const {
  criarProduto,
  listarProdutos,
  getProduto,
  atualizarProduto,
  alterarStatusProduto
} = require('../controllers/produtoController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Proteger todas as rotas
router.use(protect);

// Rotas que não precisam de autorização admin
router.get('/', listarProdutos);
router.get('/:id', getProduto);

// Rotas que precisam de autorização admin
router.post('/', authorize('admin'), criarProduto);
router.put('/:id', authorize('admin'), atualizarProduto);
router.put('/:id/status', authorize('admin'), alterarStatusProduto);

module.exports = router;