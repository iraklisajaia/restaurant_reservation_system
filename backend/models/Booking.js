const mongoose = require('mongoose');

// strict: false lets this collection keep accepting whatever fields the
// booking form sends (matching the old `{ ...req.body }` behavior) while
// still declaring the fields the API logic actually reads.
const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    date: String,
    time: String,
    party_size: mongoose.Schema.Types.Mixed,
    customerId: String
}, { strict: false });

bookingSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
