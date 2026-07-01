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

router.get('/reservations', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const reservationsData = await reservationsHelper.reservations()

        return res.status(200).json({ reservationsData })
    } catch (error) {
        console.log('Error get reservations: ', error.message)
        return res.status(401).json({ error: error.message })
    }
}),

        // Create a reservation (user)
router.post('/', authenticate, async (req, res) => {
    try {
        const { type_id, start_time, end_time, quantity, pickup_location } = req.body
        const user_id = req.user.userId

        if (!type_id || !start_time || !end_time || !quantity || !pickup_location) {
            return res.status(400).json({ error: 'Missing required fields.' })
        }

        // =========================
        // RESERVATION LIMIT CHECK
        // =========================

        const userResult = await db.query(`
            SELECT role
            FROM users
            WHERE id = $1
        `, [user_id])

        const role = userResult.rows[0].role

        const reservationLimit = role === 'staff' ? 5 : 3

        const reservationCountResult = await db.query(`
            SELECT COUNT(*) AS total
            FROM reservations
            WHERE user_id = $1
              AND status IN (
                  'approved',
                  'active',
                  'overdue',
                  'pending_return'
              )
        `, [user_id])

        const currentReservations =
            parseInt(reservationCountResult.rows[0].total, 10)

        if (currentReservations >= reservationLimit) {
            return res.status(400).json({
                error: `You have reached your reservation limit (${reservationLimit}). Please complete or return an existing reservation first.`
            })
        }

        // =========================
        // YOUR EXISTING AVAILABILITY CHECK
        // =========================

        const available = await db.query(`
            SELECT eu.id FROM equipment_units eu
            WHERE eu.type_id = $1
              AND eu.location = $2
              AND eu.status = 'available'
              AND eu.id NOT IN (
                SELECT r.unit_id FROM reservations r
                WHERE r.status NOT IN ('cancelled', 'completed', 'overdue')
                  AND r.start_time < $4
                  AND r.end_time   > $3
              )
            LIMIT $5;
        `, [type_id, pickup_location, start_time, end_time, quantity])

        if (available.rows.length < quantity) {
            return res.status(400).json({
                error: 'Not enough units available at this location for the selected time.'
            })
        }

        const inserted = []

        for (const unit of available.rows) {
            const result = await db.query(`
                INSERT INTO reservations (
                    user_id,
                    unit_id,
                    type_id,
                    start_time,
                    end_time,
                    status
                )
                VALUES ($1, $2, $3, $4, $5, 'approved')
                RETURNING *;
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
}),

// Get single reservation by ID (user)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params
        const user_id = req.user.userId

        const result = await db.query(`
            SELECT
                r.id,
                r.start_time,
                r.end_time,
                r.status,
                et.name        AS device,
                et.category,
                et.image_url,
                eu.location    AS pickup_location
            FROM reservations r
            JOIN equipment_types et ON et.id = r.type_id
            LEFT JOIN equipment_units eu ON eu.id = r.unit_id
            WHERE r.id = $1 AND r.user_id = $2;
        `, [id, user_id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reservation not found.' })
        }

        return res.status(200).json(result.rows[0])
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

router.post('/:id/scan', authenticate, async (req, res) => {
    try {
        const reservationId = req.params.id;
        const { qr_code } = req.body;
        const userId = req.user.userId;

        const result = await db.query(`
            SELECT
                r.id,
                eu.qr_code,
                r.status,
                r.start_time,
                r.end_time
            FROM reservations r
            JOIN equipment_units eu
                ON eu.id = r.unit_id
            WHERE r.id = $1
              AND r.user_id = $2
        `, [reservationId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Reservation not found'
            });
        }

        const reservation = result.rows[0];

        if (reservation.qr_code !== qr_code) {
            return res.status(400).json({
                error: 'Wrong equipment QR code'
            });
        }

        const now       = new Date();
        const startTime = new Date(reservation.start_time);
        const endTime   = new Date(reservation.end_time);

        // Pickup scan — only allowed within the booked window
        if (reservation.status === 'approved') {
            if (now < startTime) {
                return res.status(400).json({
                    error: `This equipment cannot be picked up before ${startTime.toLocaleString()}.`
                });
            }
            if (now > endTime) {
                return res.status(400).json({
                    error: `The pickup window for this reservation has expired (was until ${endTime.toLocaleString()}).`
                });
            }

            await db.query(`
                UPDATE reservations
                SET status = 'active'
                WHERE id = $1
            `, [reservationId]);

            return res.json({
                message: 'Equipment picked up successfully',
                status: 'active'
            });
        }

        if (reservation.status === 'active') {
            await db.query(`
                UPDATE reservations
                SET status = 'pending_return',
                return_time = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [reservationId]);

            return res.json({
                message: 'Return request submitted',
                status: 'pending_return'
            });
        }

        return res.json({
            message: 'QR code verified successfully'
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

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