const mongoose = require('mongoose');

// Singleton-style collection: the app only ever reads/creates a single
// settings document (see getSettings() in server.js).
const settingsSchema = new mongoose.Schema({
    tableCapacity: { type: Number, default: 40 },
    openingTime: { type: String, default: '12:00' },
    closingTime: { type: String, default: '21:00' }
});

settingsSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
