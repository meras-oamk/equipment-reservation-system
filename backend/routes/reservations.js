const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const reservationsHelper = require('../helpers/reservations')
const { authenticate, authorizeRole } = require('../helpers/role')

router.get('/return-requests', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const requestsData = await reservationsHelper.returnRequests()

        return res.status(200).json({ requestsData })
    } catch (error) {
        console.log('Error return requests: ', error.message)
        return res.status(401).json({ error: error.message })
    }
})

router.get('/conditions', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const conditionOptions = await reservationsHelper.eqCondition()
        
        return res.status(200).json({ conditionOptions })
    } catch (error) {
        console.log('Error get equipment conditions: ', error.message)
        return res.status(500).json({ error: error.message })
    }
})

router.put('/:id/return', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const reservationId = req.params.id
        const { condition, notes } = req.body

        const updatedReservation = await reservationsHelper.confirmReturn(reservationId, condition, notes)

        if (!updatedReservation) {
            return res.status(404).json({ error: 'Reservation not found' })
        }

        return res.status(200).json({ 
            message: 'Return confirmed successfully', 
            updated: updatedReservation 
        })

    } catch (error) {
        console.error('Error confirming return: ', error.message)
        return res.status(500).json({ error: error.message })
    }
})

router.get('/reservations', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const reservationsData = await reservationsHelper.reservations()

        return res.status(200).json({ reservationsData })
    } catch (error) {
        console.log('Error get reservations: ', error.message)
        return res.status(401).json({ error: error.message })
    }
})

module.exports = router