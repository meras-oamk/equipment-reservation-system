const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const reservationsHelper = require('../helpers/reservations')
const { authenticate, authorizeRole } = require('../helpers/role')
require('dotenv').config()

router.get('/return-requests', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const requestsData = await reservationsHelper.return_requests()

        return res.status(200).json({ requestsData })
    } catch (error) {
        console.log('Error return requests: ', error.message)
        return res.status(401).json({ error: error.message })
    }
})

module.exports = router