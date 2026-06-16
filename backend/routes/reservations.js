const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const reservationsHelper = require('../helpers/reservations')
const { authenticate, authorizeRole } = require('../helpers/role')
const { db } = require('../helpers/db')
require('dotenv').config()

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

// Create a reservation (user)
router.post('/', authenticate, async (req, res) => {
    try {
        const { type_id, start_time, end_time, quantity, pickup_location } = req.body
        const user_id = req.user.userId

        if (!type_id || !start_time || !end_time || !quantity) {
            return res.status(400).json({ error: 'Missing required fields.' })
        }

        // Find available units not already booked in this time slot
        const available = await db.query(`
            SELECT eu.id FROM equipment_units eu
            WHERE eu.type_id = $1
              AND eu.status = 'available'
              AND eu.id NOT IN (
                SELECT r.unit_id FROM reservations r
                WHERE r.status NOT IN ('cancelled', 'completed', 'overdue')
                  AND r.start_time < $3
                  AND r.end_time   > $2
              )
            LIMIT $4;
        `, [type_id, start_time, end_time, quantity])

        if (available.rows.length < quantity) {
            return res.status(400).json({ error: 'Not enough units available for the selected time.' })
        }

        // Insert one reservation per unit
        const inserted = []
        for (const unit of available.rows) {
            const result = await db.query(`
                INSERT INTO reservations (user_id, unit_id, type_id, start_time, end_time, status)
                VALUES ($1, $2, $3, $4, $5, 'approved')
                `, [user_id, unit.id, type_id, start_time, end_time])
            inserted.push(result.rows[0])
        }

        return res.status(201).json(inserted)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

// Get current user's reservations
router.get('/my', authenticate, async (req, res) => {
    try {
        const user_id = req.user.userId

        const result = await db.query(`
            SELECT
                r.id,
                r.start_time,
                r.end_time,
                r.status,
                et.name       AS device,
                et.image_url,
                eu.location   AS pickup_location
            FROM reservations r
            JOIN equipment_types et ON et.id = r.type_id
            LEFT JOIN equipment_units eu ON eu.id = r.unit_id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC;
            `, [user_id])

        return res.status(200).json(result.rows)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

// Cancel a reservation (user)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params
        const user_id = req.user.userId

        const result = await db.query(`
            DELETE FROM reservations
            WHERE id = $1 AND user_id = $2
            RETURNING *;
        `, [id, user_id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reservation not found.' })
        }
        return res.status(200).json({ message: 'Reservation cancelled.' })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

module.exports = router