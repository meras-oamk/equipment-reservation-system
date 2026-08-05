const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { db } = require('./db')
const sendEmail = require('./email')
require('dotenv').config()

const authHelper = {
    generateToken: (user) => {
        return jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )
    },

    getCooldown: async (email) => {
        const normalizeEmail = email.toLowerCase()
        
        const existing = await db.query(
            'SELECT expires_at FROM pending_verifications WHERE email = $1;',
            [normalizeEmail]
        );

        if (existing.rows.length > 0) {
            const currentExpiresAt = new Date(existing.rows[0].expires_at).getTime()
            
            const lastSentAt = currentExpiresAt - (10 * 60 * 1000)
            const timePassed = Date.now() - lastSentAt
            const cooldown = 60 * 1000

            if (timePassed < cooldown) {
                return Math.ceil((cooldown - timePassed) / 1000)
            }
        }
        return 0
    },

    sendVerification: async (normalizedEmail, fullname, hashedPassword) => {
        const secondsLeft = await authHelper.getCooldown(normalizedEmail)
        if (secondsLeft > 0) {
            throw new Error(`Please wait few seconds before requesting a new code.`)
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

        await db.query(`
                INSERT INTO pending_verifications (email, fullname, password, verification_code, expires_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (email) DO UPDATE
                SET fullname = $2, password = $3, verification_code = $4, expires_at = $5;
            `, [normalizedEmail, fullname, hashedPassword, verificationCode, expiresAt]
        )

        await sendEmail({
            to: normalizedEmail,
            subject: 'Verification Account',
            html: `
                <h3>Verify your email</h3>
                <p>Verification code: <strong>${verificationCode}</strong></p>
                <p>This code will expire 5 minutes after it was sent.</p>
                `
        })

        return true
    },

    register: async (fullname, email, password, isAdminCreation = false) => {
        const normalizedEmail = email.toLowerCase()

        if (!normalizedEmail.endsWith('@oamk.fi') && !normalizedEmail.endsWith('@students.oamk.fi')) {
            throw new Error('Only OAMK accounts are allowed!');
        }

        const checkUser = await db.query(
            'SELECT id FROM users WHERE email = $1;',
            [normalizedEmail]
        )

        if (checkUser.rows.length > 0) {
            throw new Error('An account with this email already exists.')
        }
        
        const hashedPassword = await bcrypt.hash(password, 10)

        if (isAdminCreation) {
            let assignedRole = 'admin'

            await db.query(`
                INSERT INTO users (full_name, email, password_hash, role)
                VALUES ($1, $2, $3, $4);    
            `, [fullname, normalizedEmail, hashedPassword, assignedRole]
            )
        } else {
            await authHelper.sendVerification(normalizedEmail, fullname, hashedPassword)
        }
    },

    validateVerificationCode: async (email, incomingCode) => {
        const normalizedEmail = email.toLowerCase()

        const result = await db.query(
            'SELECT * FROM pending_verifications WHERE email = $1;',
            [normalizedEmail]
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
        if (normalizedEmail.endsWith('@students.oamk.fi')) {
            assignedRole = 'student'
        } else if (normalizedEmail.endsWith('@oamk.fi')) {
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
            [normalizedEmail]
        )

        const token = authHelper.generateToken(newUser)
        return { token, role: newUser.role }
    },

    login: async (email, password) => {
        const normalizedEmail = email.toLowerCase()

        const getUser = await db.query('SELECT * FROM users WHERE email = $1;', [normalizedEmail])
        
        const user = getUser.rows[0]
        if (!user) throw new Error('Invalid email or password!')

        const isMatch = await bcrypt.compare(password, user.password_hash)
        if (!isMatch) throw new Error('Wrong password!')

        const token = authHelper.generateToken(user)
        return { 
            token, 
            role: user.role,
            fullname: user.full_name,
            email: user.email
        }
    },

    changePassword: async (userId, newPassword) => {
        const newHashed = await bcrypt.hash(newPassword, 10)

        const change = await db.query(`
            UPDATE users 
            SET password_hash = $1,
                updated_at = (NOW() AT TIME ZONE 'Europe/Helsinki')
            WHERE id = $2;
        `, [newHashed, userId]
        )

        if (change.rowCount === 0) {
            throw new Error('No account found.')
        }

        return true
    },

    resendCode: async (email) => {
        const normalizeEmail = email.toLowerCase()

        const checkUser = await db.query('SELECT id FROM users WHERE email = $1;', [normalizeEmail])
        if (checkUser.rows.length > 0) {
            throw new Error('This account is already verified. Please login.')
        }

        const checkPending = await db.query('SELECT fullname, password FROM pending_verifications WHERE email = $1;', [normalizeEmail])
        const pendingUser = checkPending.rows[0]
        if (!pendingUser) {
            throw new Error('No registration session found. Please register.')
        }

        await authHelper.sendVerification(normalizeEmail, pendingUser.fullname, pendingUser.password)
    
        return true
    }
}

module.exports = authHelper

