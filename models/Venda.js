const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Venda = sequelize.define('Venda', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Usuarios', // Nome da tabela de usuários
        key: 'id'
      }
    },
    data_hora: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Por favor informe o valor total da venda'
        },
        min: {
          args: [0],
          msg: 'O valor total não pode ser negativo'
        }
      }
    },
    finalizada: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    cancelada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    motivo_cancelamento: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    forma_pagamento: {
      type: DataTypes.ENUM('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'outro'),
      defaultValue: 'dinheiro',
      validate: {
        isIn: [['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'outro']]
      }
    },
    observacao: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    // Opções adicionais
    tableName: 'vendas', // nome da tabela no banco de dados
    timestamps: true, // adiciona createdAt e updatedAt
    
    // Método para configurar associações
    classMethods: {
      associate(models) {
        // Associação com Usuário
        Venda.belongsTo(models.Usuario, {
          foreignKey: 'usuario_id',
          as: 'usuario'
        });

        // Associação com VendaItem (presumindo que você terá este modelo)
        Venda.hasMany(models.VendaItem, {
          foreignKey: 'venda_id',
          as: 'itens'
        });
      }
    }
  });

  return Venda;
};