const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    date: String,
    time: String,
    party_size: mongoose.Schema.Types.Mixed,
    customerId: String,
    createdAt: String
}, { strict: false });

waitlistSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Waitlist', waitlistSchema);
