const express = require('express')
const router = express.Router()
const { db } = require('../helpers/db')
const { authenticate, authorizeRole } = require('../helpers/role')
const { upload } = require('../helpers/upload')
// Get all types
router.get('/types', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                et.*,
                COUNT(eu.id) FILTER (WHERE eu.status = 'available') AS available_count,
                COUNT(eu.id) AS total_units
            FROM equipment_types et
            LEFT JOIN equipment_units eu ON eu.type_id = et.id
            GROUP BY et.id
            ORDER BY et.created_at DESC;
        `)
        return res.status(200).json(result.rows)
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})
// Get units
router.get('/types/:id/units', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params
        const result = await db.query(
            'SELECT * FROM equipment_units WHERE type_id = $1 ORDER BY created_at DESC;',
            [id]
        )
        return res.status(200).json(result.rows)
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})
// Add type
router.post('/types', authenticate, authorizeRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { name, category, subcategory, description } = req.body
        const image_url = req.file ? req.file.path : null

        if (!name || !category || !subcategory) {
            return res.status(400).json({ error: 'Missing field!' })
        }

        const result = await db.query(`
            INSERT INTO equipment_types (name, category, subcategory, description, image_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [name, category, subcategory, description, image_url])

        return res.status(201).json(result.rows[0])
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

module.exports = router