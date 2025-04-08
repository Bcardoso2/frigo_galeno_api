// server.js (atualizado para MySQL)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database'); // Importando a conexão MySQL

// Configurações
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// No início do seu server.js
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 20; // ou um número maior conforme necessidade

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar ao MySQL
connectDB()
  .then(() => console.log('📦 MySQL conectado'))
  .catch(err => {
    console.error(`❌ Erro ao conectar ao MySQL: ${err.message}`);
    process.exit(1);
  });

// Rotas
const usuarioRoutes = require('./routes/usuarioRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const autenticacaoRoutes = require('./routes/autenticacaoRoutes');

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/auth', autenticacaoRoutes);

// Rota para testar se o servidor está rodando
app.get('/', (req, res) => {
  res.json({ 
    message: 'API do Frigorífico está funcionando!', 
    version: '1.0.0' 
  });
});

// Lidar com rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

// Manipulador global de erros
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err.stack);
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro no servidor'
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.log('ERRO NÃO TRATADO! 💥 Encerrando...');
  console.log(err.name, err.message);
  process.exit(1);
});

module.exports = app;