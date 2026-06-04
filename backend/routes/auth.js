const express = require('express')
const router = express.Router()
const authHelper = require('../helpers/auth')

router.post('/register', async (req, res) => {
    try { 
        const { fullname, email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing field!'})
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.'})
        }

        await authHelper.register(fullname, email, password)
        return res.status(200).json({
            success: true,
            message: 'Verification code has been sent.'
        })
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body
        
        if (!email || !code) {
            return res.status(400).json({ error: 'Missing field!'})
        }

        const data = await authHelper.validateVerificationCode(email, code)

        return res.status(200).json({
            message: 'Account verified successfully',
            token: data.token,
            role: data.user.role
        })
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

module.exports = router