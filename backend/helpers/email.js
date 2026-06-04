const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

async function sendEmail(options) {
    try {
        await transporter.sendMail({
            from: `"Account Verification" <${process.env.EMAIL_USER}>`
            .replace.call.options
        })
        console.log('Email sent to user!')
    } catch (err) {
        console.error('Error sending email: ', err)
    }
}

module.exports = sendEmail