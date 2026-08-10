const express = require('express')
const router = express.Router()
const { db } = require('../helpers/db')
const { authenticate, authorizeRole } = require('../helpers/role')

// Get all settings
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT key, value, updated_at FROM system_settings;')

        const settings = {}
        result.rows.forEach(row => {
            settings[row.key] = row.value
        })

        return res.status(200).json(settings)
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

// Get one setting by key
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params
        const result = await db.query('SELECT value FROM system_settings WHERE key = $1;', [key])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Setting not found.' })
        }

        return res.status(200).json(result.rows[0].value)
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

// Update (or create) a setting - admin only
router.put('/:key', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const { key } = req.params
        const value = req.body

        if (!value || typeof value !== 'object') {
            return res.status(400).json({ error: 'Invalid setting value.' })
        }

        const result = await db.query(`
            INSERT INTO system_settings (key, value, updated_at)
            VALUES ($1, $2, (NOW() AT TIME ZONE 'Europe/Helsinki'))
            ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = (NOW() AT TIME ZONE 'Europe/Helsinki')
            RETURNING *;
        `, [key, JSON.stringify(value)])

        return res.status(200).json(result.rows[0])
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

module.exports = router
