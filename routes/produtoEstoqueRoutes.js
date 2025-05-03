// routes/produtoEstoqueRoutes.js
const express = require('express');
const router = express.Router();
const { 
  associarProdutoEstoque, 
  removerAssociacao, 
  listarAssociacoesProduto 
} = require('../controllers/produtoEstoqueController');

// Rota para associar produto a um estoque animal
router.post('/', associarProdutoEstoque);

// Rota para remover uma associação
router.delete('/:id', removerAssociacao);

// Rota para listar associações de um produto
router.get('/produto/:produtoId', listarAssociacoesProduto);

module.exports = router;
