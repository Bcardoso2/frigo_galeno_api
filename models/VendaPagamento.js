const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VendaPagamento = sequelize.define('VendaPagamento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    venda_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Vendas', // Nome da tabela de vendas
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'A venda é obrigatória'
        }
      }
    },
    forma_pagamento: {
      type: DataTypes.ENUM('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'outro'),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'A forma de pagamento é obrigatória'
        },
        isIn: {
          args: [['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'outro']],
          msg: 'Forma de pagamento inválida'
        }
      }
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'O valor do pagamento é obrigatório'
        },
        min: {
          args: [0],
          msg: 'O valor do pagamento não pode ser negativo'
        }
      }
    },
    data_hora: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    // Opções adicionais
    tableName: 'venda_pagamentos', // nome da tabela no banco de dados
    timestamps: true, // adiciona createdAt e updatedAt
    
    // Método para configurar associações
    classMethods: {
      associate(models) {
        // Associação com Venda
        VendaPagamento.belongsTo(models.Venda, {
          foreignKey: 'venda_id',
          as: 'venda'
        });
      }
    }
  });

  return VendaPagamento;
};