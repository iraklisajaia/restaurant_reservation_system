const request = require('supertest');
const app = require('../server');
const authRouter = require('../auth');

// Seeded Admin/Staff accounts are created asynchronously (bcrypt hashing),
// so wait for that to finish before any test tries to log in with them.
beforeAll(() => authRouter.ready);

async function loginAs(email, password) {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.token;
}

describe('auth', () => {
    test('POST /api/auth/register creates a Customer account and returns a token', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Test Customer',
            email: `customer-${Date.now()}@example.com`,
            password: 'password123'
        });

        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.role).toBe('Customer');
    });

    test('POST /api/auth/login rejects an incorrect password', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'admin@burgerbonanza.com',
            password: 'wrong-password'
        });

        expect(res.status).toBe(401);
    });
});

describe('notifications', () => {
    test('creating a booking triggers a simulated confirmation (no SMTP configured in tests)', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const email = `notify-${Date.now()}@example.com`;
        await request(app).post('/api/auth/register').send({ name: 'Notify Me', email, password: 'password123' });
        const token = await loginAs(email, 'password123');

        await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Notify Me', email, phone: '1', date: '2026-08-05', time: '19:00', party_size: '2' });

        const loggedConfirmation = logSpy.mock.calls.some(call => call[0]?.includes('[email simulated]') && call[0]?.includes(email));
        expect(loggedConfirmation).toBe(true);

        logSpy.mockRestore();
    });
});

describe('bookings', () => {
    test('POST /api/bookings rejects requests without a token', async () => {
        const res = await request(app).post('/api/bookings').send({
            name: 'No Auth', email: 'a@a.com', phone: '1',
            date: '2026-08-01', time: '19:00', party_size: '2'
        });

        expect(res.status).toBe(401);
    });

    test('POST /api/bookings creates a reservation, then rejects once the slot is full', async () => {
        const email = `slot-${Date.now()}@example.com`;
        await request(app).post('/api/auth/register').send({ name: 'Slot Filler', email, password: 'password123' });
        const token = await loginAs(email, 'password123');

        const first = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Slot Filler', email, phone: '1', date: '2026-08-02', time: '19:00', party_size: '40' });

        expect(first.status).toBe(201);

        const second = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Slot Filler', email, phone: '1', date: '2026-08-02', time: '19:00', party_size: '1' });

        expect(second.status).toBe(409);
        expect(second.body.waitlistAvailable).toBe(true);
    });

    test('PUT /api/bookings/:id is forbidden for a Customer', async () => {
        const email = `forbidden-${Date.now()}@example.com`;
        await request(app).post('/api/auth/register').send({ name: 'Regular Guest', email, password: 'password123' });
        const token = await loginAs(email, 'password123');

        const created = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Regular Guest', email, phone: '1', date: '2026-08-03', time: '19:00', party_size: '2' });

        const update = await request(app)
            .put(`/api/bookings/${created.body.booking.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ time: '20:00' });

        expect(update.status).toBe(403);
    });

    test('PUT /api/bookings/:id lets Admin update a reservation', async () => {
        const adminToken = await loginAs('admin@burgerbonanza.com', 'Admin123!');

        const created = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Reschedule Me', email: 'r@r.com', phone: '1', date: '2026-08-04', time: '19:00', party_size: '2' });

        const update = await request(app)
            .put(`/api/bookings/${created.body.booking.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ time: '20:00' });

        expect(update.status).toBe(200);
        expect(update.body.booking.time).toBe('20:00');
    });

    test('DELETE /api/bookings/:id lets a Customer cancel their own reservation', async () => {
        const email = `self-cancel-${Date.now()}@example.com`;
        await request(app).post('/api/auth/register').send({ name: 'Self Cancel', email, password: 'password123' });
        const token = await loginAs(email, 'password123');

        const created = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Self Cancel', email, phone: '1', date: '2026-08-06', time: '19:00', party_size: '2' });

        const del = await request(app)
            .delete(`/api/bookings/${created.body.booking.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(del.status).toBe(200);
    });

    test('DELETE /api/bookings/:id forbids a Customer from cancelling another guest\'s reservation', async () => {
        const emailA = `owner-${Date.now()}@example.com`;
        const emailB = `other-${Date.now()}@example.com`;
        await request(app).post('/api/auth/register').send({ name: 'Owner', email: emailA, password: 'password123' });
        await request(app).post('/api/auth/register').send({ name: 'Other', email: emailB, password: 'password123' });
        const tokenA = await loginAs(emailA, 'password123');
        const tokenB = await loginAs(emailB, 'password123');

        const created = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Owner', email: emailA, phone: '1', date: '2026-08-07', time: '19:00', party_size: '2' });

        const del = await request(app)
            .delete(`/api/bookings/${created.body.booking.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(del.status).toBe(403);
    });
});
