const express = require('express')
const router = express.Router()
const { db } = require('../helpers/db')
const { authenticate, authorizeRole } = require('../helpers/role')
const { upload } = require('../helpers/upload')
const { generateAndUploadQR } = require('../helpers/qr')
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

// Get available unit locations for a given equipment type
router.get('/types/:id/locations', async (req, res) => {
    try {
        const { id } = req.params
        const result = await db.query(`
            SELECT
                location,
                COUNT(*) AS available_count
            FROM equipment_units
            WHERE type_id = $1
              AND status = 'available'
              AND location IS NOT NULL
            GROUP BY location
            ORDER BY location;
        `, [id])

        return res.status(200).json(result.rows)
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

// Generate next serial number for a type
router.get('/types/:id/next-serial', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params
        const prefix = `MERAS-T${id}-`

        const result = await db.query(
            `SELECT qr_code FROM equipment_units WHERE type_id = $1 AND qr_code LIKE $2`,
            [id, `${prefix}%`]
        )

        let maxNum = 700
        result.rows.forEach(row => {
            const num = parseInt(row.qr_code.replace(prefix, ''))
            if (!isNaN(num) && num > maxNum) maxNum = num
        })

        return res.status(200).json({ serial: `${prefix}${maxNum + 1}` })
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
// Edit type
router.put('/types/:id', authenticate, authorizeRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params
        const { name, category, subcategory, description } = req.body

        let image_url = req.file ? req.file.path : null
        if (!image_url) {
            const current = await db.query('SELECT image_url FROM equipment_types WHERE id = $1', [id])
            image_url = current.rows[0]?.image_url
        }

        const result = await db.query(`
            UPDATE equipment_types
            SET name = $1, category = $2, subcategory = $3, description = $4, image_url = $5, updated_at = (NOW() AT TIME ZONE 'Europe/Helsinki')
            WHERE id = $6
            RETURNING *;
        `, [name, category, subcategory, description, image_url, id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Equipment type not found.' })
        }
        return res.status(200).json(result.rows[0])
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})
// Add unit — qr_code required; backend generates QR image and uploads to Cloudinary
router.post('/units', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const { type_id, qr_code, location, status, condition } = req.body

        if (!type_id || !qr_code || !location) {
            return res.status(400).json({ error: 'Missing field!' })
        }

        let finalStatus = status || 'available'
        const finalCondition = condition || 'good'
        const badConditions = ['damaged', 'malfunction', 'missing_parts']
        if (badConditions.includes(finalCondition) && finalStatus === 'available') {
            finalStatus = 'maintenance'
        }
        
        // Generate QR image from qr_code text and upload to Cloudinary
        const qrCodeUrl = await generateAndUploadQR(qr_code)

        const result = await db.query(`
            INSERT INTO equipment_units (type_id, qr_code, qr_code_url, location, status, condition)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [type_id, qr_code, qrCodeUrl, location, finalStatus, finalCondition])

        return res.status(201).json(result.rows[0])
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

// Edit unit
router.put('/units/:id', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params
        const { qr_code, location, status, condition, notes } = req.body

        if (!qr_code || !location) {
            return res.status(400).json({ error: 'Missing field!' })
        }

        // Snapshot current state to detect changes for logging
        const current = await db.query('SELECT * FROM equipment_units WHERE id = $1;', [id])
        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Unit not found.' })
        }
        const before = current.rows[0]

        let finalStatus = status || 'available'
        const finalCondition = condition || 'good'
        const badConditions = ['damaged', 'malfunction', 'missing_parts']
        if (badConditions.includes(finalCondition) && finalStatus === 'available') {
            finalStatus = 'maintenance'
        }

        const result = await db.query(`
            UPDATE equipment_units
            SET qr_code = $1, location = $2, status = $3, condition = $4, updated_at = (NOW() AT TIME ZONE 'Europe/Helsinki')
            WHERE id = $5
            RETURNING *;
        `, [qr_code, location, finalStatus, finalCondition, id])

        const after = result.rows[0]

        // Auto-log maintenance / transfer actions triggered by this admin edit
        const statusChanged = before.status !== after.status
        const conditionChanged = before.condition !== after.condition
        const locationChanged = before.location !== after.location

        let logAction = null
        let logNotes = notes || null

        if (statusChanged || conditionChanged) {
            logAction = 'status_update'
            if (locationChanged && !logNotes) {
                logNotes = `Location changed from ${before.location} to ${after.location}`
            }
        } else if (locationChanged) {
            logAction = 'transfer'
            if (!logNotes) {
                logNotes = `Moved from ${before.location} to ${after.location}`
            }
        }

        if (logAction) {
            await db.query(`
                INSERT INTO equipment_logs
                    (unit_id, user_id, action, status_before, status_after, condition_before, condition_after, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `, [id, req.user.userId, logAction, before.status, after.status, before.condition, after.condition, logNotes])
        }

        return res.status(200).json(after)
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

// QR print data — returns unit info + type name + qr_code_url
router.get('/units/:id/qr-print', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params
        const result = await db.query(`
            SELECT
                eu.id,
                eu.qr_code,
                eu.qr_code_url,
                eu.location,
                eu.status,
                eu.condition,
                et.name  AS type_name,
                et.category
            FROM equipment_units eu
            JOIN equipment_types et ON et.id = eu.type_id
            WHERE eu.id = $1;
        `, [id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Unit not found.' })
        }
        return res.status(200).json(result.rows[0])
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

// Delete unit
router.delete('/units/:id', authenticate, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params

        const result = await db.query('DELETE FROM equipment_units WHERE id = $1 RETURNING *;', [id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Unit not found.' })
        }
        return res.status(200).json({ message: 'Unit deleted.' })
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

// User catalog endpoint
router.get('/catalog', async (req, res) => {
    try {

        const { category, subcategory } = req.query;

        let query = `
            SELECT
                et.id,
                et.name,
                et.category,
                et.subcategory,
                et.description,
                et.image_url,
                COUNT(eu.id) FILTER (
                    WHERE eu.status = 'available'
                ) AS available_count
            FROM equipment_types et
            LEFT JOIN equipment_units eu
                ON eu.type_id = et.id
        `;

        const conditions = [];
        const values = [];

        if (category) {
            conditions.push(`et.category = $${values.length + 1}`);
            values.push(category);
        }

        if (subcategory) {
            conditions.push(`LOWER(et.subcategory) = LOWER($${values.length + 1})`);
            values.push(subcategory);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += `
            GROUP BY et.id
            ORDER BY et.name
        `;

        const result = await db.query(query, values);

        return res.status(200).json(result.rows);

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

// Get single type by ID
router.get('/types/:id', async (req, res) => {
    try {
        const { id } = req.params
        const result = await db.query(`
            SELECT
                et.*,
                COUNT(eu.id) FILTER (WHERE eu.status = 'available') AS available_count,
                COUNT(eu.id) AS total_units
            FROM equipment_types et
            LEFT JOIN equipment_units eu ON eu.type_id = et.id
            WHERE et.id = $1
            GROUP BY et.id;
        `, [id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Equipment not found.' })
        }
        return res.status(200).json(result.rows[0])
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
})

module.exports = router