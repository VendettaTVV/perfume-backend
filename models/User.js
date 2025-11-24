const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  // ❗️ НОВОЕ ПОЛЕ: Список избранного
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product' // Ссылка на коллекцию продуктов
  }],
  
  // Поля для сброса пароля (если мы их добавляли ранее)
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);