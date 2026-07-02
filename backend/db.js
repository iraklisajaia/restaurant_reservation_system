const dns = require('dns');
const mongoose = require('mongoose');

// mongodb+srv:// URIs require a DNS SRV lookup before connecting. On some
// Windows machines (and some ISPs/routers/VPNs) the system-configured DNS
// resolver fails or refuses these lookups with `querySrv ECONNREFUSED`,
// even though the machine has normal internet access otherwise. Pointing
// Node's resolver at public DNS servers fixes this in almost all cases.
// Set MONGODB_DISABLE_DNS_OVERRIDE=true to skip this if it ever conflicts
// with your network setup.
if (process.env.MONGODB_DISABLE_DNS_OVERRIDE !== 'true') {
    try {
        dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
    } catch (err) {
        console.warn('Could not override DNS servers for MongoDB SRV lookups:', err.message);
    }
}

// Cache the connection promise so repeated calls (e.g. from server.js and
// auth.js, or across test files) share a single connection instead of
// opening a new one every time this module is required.
let connectionPromise = null;

mongoose.connection.on('connected', () => {
    console.log(`MongoDB connected (db: ${mongoose.connection.name})`);
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
});

function connectDB() {
    if (connectionPromise) {
        return connectionPromise;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.warn(
            'MONGODB_URI is not set. Set it in backend/.env to connect to MongoDB ' +
            '(see backend/.env.example). Requests that touch the database will hang until it is configured.'
        );
        connectionPromise = Promise.resolve(null);
        return connectionPromise;
    }

    connectionPromise = mongoose
        .connect(uri, {
            dbName: process.env.MONGODB_DB_NAME || 'rrsystem',
            serverSelectionTimeoutMS: 10000
        })
        .then((conn) => conn)
        .catch((err) => {
            console.error('Failed to connect to MongoDB:', err.message);
            if (err.message.includes('querySrv') || err.code === 'ECONNREFUSED') {
                console.error(
                    'This looks like a DNS problem resolving the mongodb+srv:// address rather than ' +
                    'a MongoDB Atlas problem. If this keeps happening, try switching your machine/network ' +
                    'DNS to 8.8.8.8, or set MONGODB_URI to the non-SRV "mongodb://host1,host2,host3/..." ' +
                    'form from your Atlas connection dialog instead.'
                );
            }
            throw err;
        });

    return connectionPromise;
}

module.exports = { connectDB, mongoose };
