const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('./authMiddleware');
const { connectDB } = require('./db');
const User = require('./models/User');

const router = express.Router();

async function seedUsers() {
    const seeds = [
        { name: 'Restaurant Admin', email: 'admin@burgerbonanza.com', password: 'Admin123!', role: 'Admin' },
        { name: 'Floor Staff', email: 'staff@burgerbonanza.com', password: 'Staff123!', role: 'Staff' }
    ];

    for (const seed of seeds) {
        const existing = await User.findOne({ email: seed.email });
        if (!existing) {
            const passwordHash = await bcrypt.hash(seed.password, 10);
            await User.create({ name: seed.name, email: seed.email, passwordHash, role: seed.role });
        }
    }
}

// Exposed so tests can wait for the MongoDB connection plus the seeded
// Admin/Staff accounts to exist before logging in with them.
const usersReady = connectDB().then(seedUsers);
usersReady.catch(err => console.error('Failed to seed default users:', err.message));

function signToken(user) {
    return jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
}

router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, passwordHash, role: 'Customer' });

        const token = signToken(user);
        res.status(201).json({ token, user });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = signToken(user);
        res.json({ token, user });
    } catch (err) {
        next(err);
    }
});

router.get('/me', verifyToken, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ user });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
module.exports.ready = usersReady;
