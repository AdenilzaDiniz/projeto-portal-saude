const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definindo o esquema do usuário
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  tipo: String
});

// Método para validar senha
UserSchema.methods.validarSenha = function (senha) {
  return bcrypt.compareSync(senha, this.password);
};

// Exportando o modelo
module.exports = mongoose.model('User', UserSchema);
