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
const { protect, admin } = require('../middleware/authMiddleware');

// Rotas protegidas (requerem autenticação)
router
  .route('/')
  .post(protect, admin, adicionarEstoqueAnimal)
  .get(protect, listarEstoqueAnimal);

router
  .route('/:id')
  .get(protect, getEstoqueAnimalPorId)
  .put(protect, admin, atualizarEstoqueAnimal)
  .delete(protect, admin, excluirEstoqueAnimal);

module.exports = router;
