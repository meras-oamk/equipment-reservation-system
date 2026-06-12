const { db } = require('./db')

const reservationsHelper = {
    return_requests: async () => {
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

            WHERE r.status = 'pending_return';
        `)

        return pendingReturn.rows 
    }
}

module.exports = reservationsHelper