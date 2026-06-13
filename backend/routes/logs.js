const express = require('express')
const router = express.Router()
const { db } = require('../helpers/db')
const { authenticate, authorizeRole } = require('../helpers/role')

// Get all equipment logs
router.get('/', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                el.id,
                el.action,
                el.status_before,
                el.status_after,
                el.condition_before,
                el.condition_after,
                el.notes,
                el.created_at,
                et.name    AS equipment_name,
                eu.qr_code AS unit_code,
                u.full_name AS user_name,
                u.email      AS user_email
            FROM equipment_logs el
            LEFT JOIN equipment_units eu ON eu.id = el.unit_id
            LEFT JOIN equipment_types et ON et.id = eu.type_id
            LEFT JOIN users u ON u.id = el.user_id
            ORDER BY el.created_at DESC;
        `)
        return res.status(200).json(result.rows)
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

module.exports = router
