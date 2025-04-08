const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Por favor informe o nome'
        },
        notEmpty: {
          msg: 'O nome não pode estar vazio'
        }
      },
      trim: true
    },
    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Este login já está em uso'
      },
      validate: {
        notNull: {
          msg: 'Por favor informe o login'
        },
        notEmpty: {
          msg: 'O login não pode estar vazio'
        }
      },
      trim: true
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Por favor informe a senha'
        },
        len: {
          args: [6, 255],
          msg: 'A senha deve ter no mínimo 6 caracteres'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'vendedor'),
      defaultValue: 'vendedor'
    }
  }, {
    // Opções adicionais
    tableName: 'usuarios', // nome da tabela no banco de dados
    hooks: {
      // Hook para criptografar a senha antes de salvar
      beforeCreate: async (usuario) => {
        if (usuario.senha) {
          const salt = await bcrypt.genSalt(10);
          usuario.senha = await bcrypt.hash(usuario.senha, salt);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed('senha')) {
          const salt = await bcrypt.genSalt(10);
          usuario.senha = await bcrypt.hash(usuario.senha, salt);
        }
      }
    },
    // Métodos de instância
    instanceMethods: {
      async matchPassword(senhaInformada) {
        return await bcrypt.compare(senhaInformada, this.senha);
      }
    }
  });

  return Usuario;
};