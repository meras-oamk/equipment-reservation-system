const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

async function sendEmail(options) {
    try {
        await transporter.sendMail({
            from: `"Account Verification" <${process.env.EMAIL_USER}>`,
            ...options
        })
        console.log('Email sent to user!')
    } catch (error) {
        console.error('Error sending email: ', error)
    }
}

module.exports = sendEmail