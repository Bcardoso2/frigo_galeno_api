const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');

// Rotas de venda
router.post('/', vendaController.registrarVenda);
router.post('/completa', vendaController.registrarVendaCompleta);
router.get('/', vendaController.listarVendas);
router.get('/resumo-dia', vendaController.getResumoDiario);
router.get('/relatorio', vendaController.getRelatorioVendas); // MOVIDO PARA ANTES da rota com /:id
router.get('/:id', vendaController.getVenda);
router.put('/:id/cancelar', vendaController.cancelarVenda);

module.exports = router;
