const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
}

async function sendEmail(to, subject, text) {
    if (!transporter) {
        console.log(`[email simulated] To: ${to} | Subject: ${subject}\n${text}\n`);
        return { simulated: true };
    }

    return transporter.sendMail({
        from: process.env.SMTP_FROM || '"Burger Bonanza" <reservations@burgerbonanza.com>',
        to,
        subject,
        text
    });
}


function sendBookingConfirmation(booking) {
    const subject = `Reservation confirmed for ${booking.date} at ${booking.time}`;
    const text = `Hi ${booking.name},\n\nYour table for ${booking.party_size} is confirmed for ${booking.date} at ${booking.time}.\n\nSee you soon!\nBurger Bonanza`;
    return sendEmail(booking.email, subject, text).catch(err => {
        console.error('Failed to send booking confirmation email:', err.message);
    });
}

function sendWaitlistConfirmation(entry) {
    const subject = `You're on the waitlist for ${entry.date} at ${entry.time}`;
    const text = `Hi ${entry.name},\n\nWe're fully booked for ${entry.date} at ${entry.time}, but we've added you to the waitlist for ${entry.party_size} guest(s). We'll email you as soon as a table opens up.\n\nBurger Bonanza`;
    return sendEmail(entry.email, subject, text).catch(err => {
        console.error('Failed to send waitlist confirmation email:', err.message);
    });
}

module.exports = { sendBookingConfirmation, sendWaitlistConfirmation };
