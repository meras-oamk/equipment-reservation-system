const { db } = require('./db')
const sendEmail = require('./email')

const reservationsHelper = {
    returnRequests: async () => {
        const pendingReturn = await db.query(`
            SELECT 
                u.full_name,
                u.email,

                r.id AS reservation_id,
                r.start_time,
                r.end_time,
                r.return_scan_time,

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
            ORDER BY r.return_scan_time ASC;
        `)

        return pendingReturn.rows 
    },

    eqCondition: async () => {
        const conditions = await db.query('SELECT unnest(enum_range(NULL::equipment_condition)) AS condition;')

        return conditions.rows.map(row => row.condition)
    },

    confirmReturn: async (reservationId, condition, notes, adminId) => {
        const reservationQuery = await db.query(`
            SELECT r.unit_id, eu.condition AS condition_before,
                   u.email AS user_email, u.full_name AS user_name,
                   et.name AS equipment_name
            FROM reservations r
            JOIN equipment_units eu ON eu.id = r.unit_id
            JOIN users u ON u.id = r.user_id
            JOIN equipment_types et ON et.id = r.type_id
            WHERE r.id = $1;
        `, [reservationId])

        if (reservationQuery.rows.length === 0) {
            throw new Error('Reservation not found')
        }

        const { unit_id: unitId, condition_before: conditionBefore,
                user_email: userEmail, user_name: userName,
                equipment_name: equipmentName } = reservationQuery.rows[0];

        const updateReservationResult = await db.query(`
            UPDATE reservations
            SET status = 'completed',
                return_notes = $1,
                return_time = (NOW() AT TIME ZONE 'Europe/Helsinki')
            WHERE id = $2
            RETURNING *;
        `, [notes, reservationId])

        await db.query(
            `UPDATE equipment_units
             SET condition = $1, status = 'available'
             WHERE id = $2;`,
            [condition, unitId]
        )

        await db.query(`
            INSERT INTO equipment_logs (unit_id, user_id, reservation_id, action, status_before, status_after, condition_before, condition_after, notes)
            VALUES ($1, $2, $3, 'admin_confirm_return', 'pending_return', 'available', $4, $5, $6)
        `, [unitId, adminId, reservationId, conditionBefore, condition, notes])

        // Notify user
        const returnDate = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Helsinki' })
        await sendEmail({
            to: userEmail,
            subject: `Return Confirmed – ${equipmentName}`,
            html: `
                <p>Hi ${userName},</p>
                <p>Your return of <strong>${equipmentName}</strong> has been confirmed by the admin.</p>
                <table style="border-collapse:collapse;font-size:14px">
                    <tr><td style="padding:4px 12px 4px 0;color:#888">Return time</td><td><strong>${returnDate}</strong></td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#888">Condition</td><td><strong>${condition}</strong></td></tr>
                    ${notes ? `<tr><td style="padding:4px 12px 4px 0;color:#888">Notes</td><td>${notes}</td></tr>` : ''}
                </table>
                <p>Your reservation is now <strong>completed</strong>. Thank you!</p>
            `
        })

        return updateReservationResult.rows[0];
    },

    reservations: async () => {
        const reservations = await db.query(`
            SELECT
                u.full_name,
                u.email,

                r.id              AS reservation_id,
                r.created_at,
                r.start_time,
                r.end_time,
                r.checkout_time,
                r.return_scan_time,
                r.return_time,
                r.cancelled_at,
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

            ORDER BY r.id DESC;
        `)

        return reservations.rows
    }
}

module.exports = reservationsHelper