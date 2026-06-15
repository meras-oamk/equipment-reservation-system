const express = require('express')
const router = express.Router()
const manageUsersHelper = require('../helpers/manageUsers')
const { authenticate, authorizeRole } = require('../helpers/role')

router.get('/users', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const usersData = await manageUsersHelper.usersAndHistory()

        return res.status(200).json({ usersData })
    }catch (error) {
        console.log('Error get user data and history: ', error.message)
        return res.status(401).json({ error: error.message })
    }
})

module.exports = router