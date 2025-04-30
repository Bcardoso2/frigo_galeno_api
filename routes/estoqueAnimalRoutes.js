// routes/estoqueAnimalRoutes.js
const express = require('express');
const router = express.Router();
const EstoqueAnimalController = require('../controllers/estoqueAnimalController');

// Rota para listar todos os registros
router.get('/', EstoqueAnimalController.index);

// Rota para exibir um registro específico
router.get('/:id', EstoqueAnimalController.show);

// Rota para criar um novo registro
router.post('/', EstoqueAnimalController.store);

// Rota para atualizar um registro
router.put('/:id', EstoqueAnimalController.update);

// Rota para excluir um registro
router.delete('/:id', EstoqueAnimalController.destroy);

module.exports = router;
