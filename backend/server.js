require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const { connectDB, mongoose } = require('./db');
const authRouter = require('./auth');
const { verifyToken, requireRole } = require('./authMiddleware');
const { sendBookingConfirmation, sendWaitlistConfirmation } = require('./notifications');
const Booking = require('./models/Booking');
const Waitlist = require('./models/Waitlist');
const Settings = require('./models/Settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Kick off the MongoDB connection as soon as the app is loaded. Mongoose
// queues queries until the connection is ready, so routes below don't need
// to explicitly wait for this.
connectDB().catch(() => { /* already logged in db.js */ });

const allowedOrigins = [
    "http://localhost:3000",
    "https://rrsfinal.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}));
app.use(express.json());

app.use('/api/auth', authRouter);

const DEFAULT_SETTINGS = {
    tableCapacity: 40,
    openingTime: "12:00",
    closingTime: "21:00"
};

async function getSettings() {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create(DEFAULT_SETTINGS);
    }
    return settings;
}

function isStaffOrAdmin(role) {
    return role === 'Staff' || role === 'Admin';
}

app.get('/api/bookings', verifyToken, async (req, res, next) => {
    try {
        if (isStaffOrAdmin(req.user.role)) {
            return res.json(await Booking.find());
        }
        res.json(await Booking.find({ customerId: req.user.id }));
    } catch (err) {
        next(err);
    }
});

app.get('/api/settings', async (req, res, next) => {
    try {
        res.json(await getSettings());
    } catch (err) {
        next(err);
    }
});

async function seatsBooked(date, time, excludeId = null) {
    const query = { date, time };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    const matching = await Booking.find(query);
    return matching.reduce((sum, b) => sum + (parseInt(b.party_size) || 0), 0);
}

function isWithinOperatingHours(time, settings) {
    return time >= settings.openingTime && time <= settings.closingTime;
}

app.post('/api/bookings', verifyToken, async (req, res, next) => {
    try {
        const { date, time, party_size } = req.body;
        const partySize = parseInt(party_size);

        if (!date || !time || !Number.isInteger(partySize) || partySize <= 0) {
            return res.status(400).json({ message: "Date, time and a valid party size are required." });
        }

        const settings = await getSettings();
        if (!isWithinOperatingHours(time, settings)) {
            return res.status(400).json({
                message: `We're only taking reservations between ${settings.openingTime} and ${settings.closingTime}.`
            });
        }

        const booked = await seatsBooked(date, time);
        if (booked + partySize > settings.tableCapacity) {
            const remaining = Math.max(settings.tableCapacity - booked, 0);
            return res.status(409).json({
                message: remaining > 0
                    ? `Only ${remaining} seat(s) left for ${time} on ${date}.`
                    : `${time} on ${date} is fully booked.`,
                waitlistAvailable: true
            });
        }

        const newBooking = await Booking.create({ ...req.body, customerId: req.user.id });
        sendBookingConfirmation(newBooking);
        res.status(201).json({ message: "Booking successful!", booking: newBooking });
    } catch (err) {
        next(err);
    }
});

app.put('/api/bookings/:id', verifyToken, requireRole('Staff', 'Admin'), async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const existing = await Booking.findById(bookingId);
        if (!existing) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const merged = { ...existing.toObject(), ...req.body };
        delete merged._id;
        delete merged.__v;
        const partySize = parseInt(merged.party_size);

        if (!merged.date || !merged.time || !Number.isInteger(partySize) || partySize <= 0) {
            return res.status(400).json({ message: "Date, time and a valid party size are required." });
        }

        const settings = await getSettings();
        if (!isWithinOperatingHours(merged.time, settings)) {
            return res.status(400).json({
                message: `We're only taking reservations between ${settings.openingTime} and ${settings.closingTime}.`
            });
        }

        const booked = await seatsBooked(merged.date, merged.time, bookingId);
        if (booked + partySize > settings.tableCapacity) {
            const remaining = Math.max(settings.tableCapacity - booked, 0);
            return res.status(409).json({
                message: remaining > 0
                    ? `Only ${remaining} seat(s) left for ${merged.time} on ${merged.date}.`
                    : `${merged.time} on ${merged.date} is fully booked.`
            });
        }

        const updated = await Booking.findByIdAndUpdate(
            bookingId,
            { $set: merged },
            { new: true, runValidators: true }
        );

        res.json({ message: "Booking updated", booking: updated });
    } catch (err) {
        next(err);
    }
});

app.put('/api/settings', verifyToken, requireRole('Admin'), async (req, res, next) => {
    try {
        const current = await getSettings();
        const updated = { ...current.toObject(), ...req.body };
        const capacity = parseInt(updated.tableCapacity);

        if (!Number.isInteger(capacity) || capacity <= 0) {
            return res.status(400).json({ message: "Table capacity must be a positive number." });
        }
        if (!updated.openingTime || !updated.closingTime || updated.openingTime >= updated.closingTime) {
            return res.status(400).json({ message: "Opening time must be earlier than closing time." });
        }

        current.tableCapacity = capacity;
        current.openingTime = updated.openingTime;
        current.closingTime = updated.closingTime;
        await current.save();

        res.json({ message: "Settings updated", settings: current });
    } catch (err) {
        next(err);
    }
});

app.delete('/api/bookings/:id', verifyToken, async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        if (!isStaffOrAdmin(req.user.role) && booking.customerId !== req.user.id) {
            return res.status(403).json({ message: "You do not have permission to cancel this reservation." });
        }

        await Booking.deleteOne({ _id: req.params.id });
        res.json({ message: "Booking deleted" });
    } catch (err) {
        next(err);
    }
});

app.get('/api/waitlist', verifyToken, async (req, res, next) => {
    try {
        if (isStaffOrAdmin(req.user.role)) {
            return res.json(await Waitlist.find());
        }
        res.json(await Waitlist.find({ customerId: req.user.id }));
    } catch (err) {
        next(err);
    }
});

app.post('/api/waitlist', verifyToken, async (req, res, next) => {
    try {
        const { date, time, party_size } = req.body;
        const partySize = parseInt(party_size);

        if (!date || !time || !Number.isInteger(partySize) || partySize <= 0) {
            return res.status(400).json({ message: "Date, time and a valid party size are required." });
        }
        const settings = await getSettings();
        if (!isWithinOperatingHours(time, settings)) {
            return res.status(400).json({
                message: `We're only taking reservations between ${settings.openingTime} and ${settings.closingTime}.`
            });
        }

        const entry = await Waitlist.create({
            ...req.body,
            customerId: req.user.id,
            createdAt: new Date().toISOString()
        });
        sendWaitlistConfirmation(entry);
        res.status(201).json({ message: "Added to the waitlist.", entry });
    } catch (err) {
        next(err);
    }
});

app.delete('/api/waitlist/:id', verifyToken, async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Waitlist entry not found." });
        }

        const entry = await Waitlist.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: "Waitlist entry not found." });
        }
        if (entry.customerId !== req.user.id && !isStaffOrAdmin(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission to do that." });
        }

        await Waitlist.deleteOne({ _id: req.params.id });
        res.json({ message: "Removed from waitlist." });
    } catch (err) {
        next(err);
    }
});

app.post('/api/waitlist/:id/seat', verifyToken, requireRole('Staff', 'Admin'), async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Waitlist entry not found." });
        }

        const entry = await Waitlist.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: "Waitlist entry not found." });
        }

        const partySize = parseInt(entry.party_size);
        const settings = await getSettings();
        const booked = await seatsBooked(entry.date, entry.time);
        if (booked + partySize > settings.tableCapacity) {
            const remaining = Math.max(settings.tableCapacity - booked, 0);
            return res.status(409).json({
                message: remaining > 0
                    ? `Only ${remaining} seat(s) left for ${entry.time} on ${entry.date}.`
                    : `${entry.time} on ${entry.date} is still fully booked.`
            });
        }

        const bookingData = entry.toObject();
        delete bookingData._id;
        delete bookingData.__v;
        delete bookingData.createdAt;

        const newBooking = await Booking.create(bookingData);
        await Waitlist.deleteOne({ _id: req.params.id });
        sendBookingConfirmation(newBooking);
        res.status(201).json({ message: "Seated from waitlist.", booking: newBooking });
    } catch (err) {
        next(err);
    }
});

app.use((req, res) => {
    res.status(404).json({ message: "Not found." });
});

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
        return res.status(400).json({ message: "Invalid JSON in request body." });
    }
    console.error(err);
    res.status(err.status || 500).json({ message: "Something went wrong on our end." });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
