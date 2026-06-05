const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { db } = require('../../database/db')
const sendEmail = require('./email')
require('dotenv').config()

const authHelper = {
    register: async (fullname, email, password) => {
        const trimEmail = email.toLowerCase().trim()

        const checkEmail = trimEmail.includes('oamk.fi')

        if (checkEmail) {
            const checkUser = await db.query(
                'SELECT id FROM users WHERE email = $1;',
                [trimEmail]
            )

            if (checkUser.rows.length > 0) {
                throw new Error('An account with this email already exists.')
            }
    
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
            const hashedPassword = await bcrypt.hash(password, 10)
    
            const temporaryRegister = await db.query(`
                INSERT INTO pending_verifications (email, fullname, password, verification_code, expires_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (email) DO UPDATE
                SET fullname = $2, password = $3, verification_code = $4, expires_at = $5;
            `, [email, fullname, hashedPassword, verificationCode, expiresAt]
            )
    
            // Email content
            await sendEmail({
                to: trimEmail,
                subject: 'Verification Account',
                html: `
                    <h3>Verify your email</h3>
                    <p>Verification code: <strong>${verificationCode}</strong></p>
                    <p>This code will expire 10 minutes after it was sent.</p>
                    `
            })
        } else {
            throw new Error('Invalid email!')
        }
    },

    validateVerificationCode: async (email, incomingCode) => {
        const trimEmail = email.toLowerCase().trim()

        const result = await db.query(
            'SELECT * FROM pending_verifications WHERE email = $1;',
            [trimEmail]
        )
        const pendingUser = result.rows[0]

        if (!pendingUser) {
            throw new Error('No registration session found for this email.')
        }
        
        if (new Date() > new Date(pendingUser.expires_at)) {
            throw new Error('This verification code has expired. Please register again.')
        }

        if (pendingUser.verification_code !== incomingCode.trim()) {
            throw new Error('Invalid verification code. Please check your email and try again.')
        }

        let assignedRole = ''
        if (trimEmail.includes('@students.oamk.fi')) {
            assignedRole = 'student'
        } else if (trimEmail.includes('@oamk.fi')) {
            assignedRole = 'staff'
        }

        const registerUser = await db.query(`
           INSERT INTO users (full_name, email, password_hash, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id, full_name, email, role; 
        `, [pendingUser.fullname, pendingUser.email, pendingUser.password, assignedRole]
        )

        const newUser = registerUser.rows[0]

        await db.query(
            'DELETE FROM pending_verifications WHERE email = $1;',
            [trimEmail]
        )

        const token = jwt.sign(
            { userId: newUser.id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )
        return { token, user: newUser }
    },

    login: async (email, password) => {
        const trimEmail = email.toLowerCase().trim()

        const getUser = await db.query('SELECT * FROM users WHERE email = $1;', [trimEmail])
        
        const user = getUser.rows[0]
        if (!user) throw new Error('Invalid email or password!')

        const isMatch = await bcrypt.compare(password, user.password_hash)
        if (!isMatch) throw new Error('Wrong password!')

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h'}
        )

        return { token, role: user.role }
    }
}

module.exports = authHelper

