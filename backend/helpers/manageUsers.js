const { db } = require('./db')

const manageUsersHelper = {
    usersAndHistory: async () => {
        const result = await db.query(`
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.created_at,
                u.is_active,

                r.id AS reservation_id,
                r.start_time,
                r.end_time,
                r.status,

                et.category,
                et.name AS equipment_name

            FROM users u

            LEFT JOIN reservations r 
                ON u.id = r.user_id

            LEFT JOIN equipment_types et 
                ON r.type_id = et.id

            WHERE u.role IN ('student', 'staff')

            ORDER BY u.id, r.start_time DESC;
        `)

        const grouped = {}

        for (const row of result.rows) {
            const userId = row.id

            if (!grouped[userId]) {
                grouped[userId] = {
                id: row.id,
                full_name: row.full_name,
                email: row.email,
                is_active: row.is_active,
                created_at: row.created_at,
                reservations: []
                }
            }

            if (row.reservation_id) {
                grouped[userId].reservations.push({
                    id: row.reservation_id,
                    start_time: row.start_time,
                    end_time: row.end_time,
                    status: row.status,
                    equipment: {
                        category: row.category,
                        name: row.equipment_name
                    }
                })
            }
        }

        const users = Object.values(grouped)

        return users
    }
}

module.exports = manageUsersHelper