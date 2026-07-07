const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const authHelper = require('../helpers/auth')
const { authenticate, authorizeRole } = require('../helpers/role')
require('dotenv').config()

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
            message: 'Verification code has been sent.'
        })
    } catch (error) {
        console.error('Error register: ', error)
        return res.status(400).json({ error: error.message })
    }
})

router.post('/verify-email', async (req, res) => {
    try {
        const { email, verificationCode } = req.body
        
        if (!email || !verificationCode) {
            return res.status(400).json({ error: 'Missing field!'})
        }

        const data = await authHelper.validateVerificationCode(email, verificationCode)

        return res.status(200).json({
            token: data.token,
            role: data.role
        })
    } catch (error) {
        console.error('Error verify email: ' + error.message)
        return res.status(400).json({ error: error.message })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing field!'})
        }

        const loginData = await authHelper.login(email, password)

        return res.status(200).json({
            token: loginData.token,
            role: loginData.role,
            fullname: loginData.fullname,
            email: loginData.email
        })
    } catch (error) {
        console.error('Error login: ' + error.message)
        return res.status(401).json({ error: error.message })
    }
})

router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { newPassword } = req.body
        const userId = req.user.userId

        if (!newPassword) {
            return res.status(400).json({ error: 'Missing field!'})
        }

        await authHelper.changePassword(userId, newPassword)

        return res.status(200).json({ message: 'Password changed successfully!'})
    } catch (error) {
        console.error('Error changing password: ' + error.message)
        return res.status(500).json({ error: error.message})
    }
})

router.post('/resendCode', async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: 'Email parameter is required!' })
        }

        await authHelper.resendCode(email)
        res.status(200).json({ message: 'A new 6-digit verification code has been sent to your email.' })
    
    } catch (error) {
        console.error('Error resending code: ' + error.message)
        return res.status(400).json({ error: error.message })
    }
})

router.post('/admin/add-user', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const { fullname, email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing fields!' })
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        await authHelper.register(fullname, email, password, true)

        return res.status(201).json({ message: 'Admin account created!' })
    } catch (error) {
        console.error('Error admin register: ', error)
        return res.status(400).json({ error: error.message })
    }
})

module.exports = router