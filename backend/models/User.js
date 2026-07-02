const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Customer', 'Staff', 'Admin'], default: 'Customer' }
});

// Keep the public API shape identical to the old in-memory version:
// an `id` string instead of Mongo's `_id`, and never expose passwordHash.
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);
