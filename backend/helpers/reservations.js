const { db } = require('./db')

const reservationsHelper = {
    returnRequests: async () => {
        const pendingReturn = await db.query(`
            SELECT 
                u.full_name,
                u.email,

                r.id AS reservation_id,
                r.start_time,
                r.end_time,
                r.return_time,

                et.name AS equipment_name,
                eu.qr_code,
                eu.location

            FROM reservations r

            JOIN users u 
                ON r.user_id = u.id

            LEFT JOIN equipment_units eu 
                ON r.unit_id = eu.id

            LEFT JOIN equipment_types et 
                ON r.type_id = et.id

            WHERE r.status = 'pending_return'
            ORDER BY r.return_time ASC;
        `)

        return pendingReturn.rows 
    },

    eqCondition: async () => {
        const conditions = await db.query('SELECT unnest(enum_range(NULL::equipment_condition)) AS condition;')

        return conditions.rows.map(row => row.condition)
    },

    confirmReturn: async (reservationId, condition, notes) => {
        const reservationQuery = await db.query(`SELECT unit_id FROM reservations WHERE id = $1;`, [reservationId])

        if (reservationQuery.rows.length === 0) {
            throw new Error('Reservation not found')
        }

        const unitId = reservationQuery.rows[0].unit_id;

        const updateReservationResult = await db.query(`
            UPDATE reservations 
            SET status = 'completed', 
                return_notes = $1, 
                return_time = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *;
        `, [notes, reservationId]
        )

        await db.query(
            `UPDATE equipment_units 
             SET condition = $1 
             WHERE id = $2;`,
            [condition, unitId]
        )

        return updateReservationResult.rows[0];
    },

    reservations: async () => {
        const reservations = await db.query(`
            SELECT 
                u.full_name,
                u.email,

                r.id AS reservation_id,
                r.start_time,
                r.end_time,
                r.status,

                et.name AS equipment_name,
                eu.qr_code

            FROM reservations r

            JOIN users u 
                ON r.user_id = u.id

            LEFT JOIN equipment_units eu 
                ON r.unit_id = eu.id

            LEFT JOIN equipment_types et 
                ON r.type_id = et.id

            ORDER BY r.id ASC;
        `)

        return reservations.rows
    }
}

module.exports = reservationsHelper