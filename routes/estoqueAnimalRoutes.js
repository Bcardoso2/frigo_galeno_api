// routes/estoqueAnimalRoutes.js
const express = require('express');
const router = express.Router();
const { 
  adicionarEstoqueAnimal, 
  listarEstoqueAnimal, 
  getEstoqueAnimalPorId, 
  atualizarEstoqueAnimal, 
  excluirEstoqueAnimal 
} = require('../controllers/estoqueAnimalController');

// Rotas abertas temporariamente (sem middleware de autenticação)
router
  .route('/')
  .post(adicionarEstoqueAnimal)
  .get(listarEstoqueAnimal);

router
  .route('/:id')
  .get(getEstoqueAnimalPorId)
  .put(atualizarEstoqueAnimal)
  .delete(excluirEstoqueAnimal);

module.exports = router;
