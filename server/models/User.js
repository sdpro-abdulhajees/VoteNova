const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  faceDescriptor: { type: Array, required: true },  // face-api.js descriptor (Float32 array)
});

module.exports = mongoose.model('User', UserSchema);
