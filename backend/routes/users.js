const express = require('express');
const router = express.Router();
const { authenticate } = require('../helpers/role');
const { db } = require('../helpers/db');

router.get('/me', authenticate, async (req, res) => {
    try {

        const result = await db.query(`
            SELECT
                id,
                full_name,
                email,
                role
            FROM users
            WHERE id = $1
        `, [req.user.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Server error'
        });
    }
});

module.exports = router;