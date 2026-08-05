const { db } = require('./db')

const manageUsersHelper = {
    usersAndHistory: async () => {
        const result = await db.query(`
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.status AS user_status,
                u.created_at,

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

            ORDER BY u.id DESC, r.start_time DESC;
        `)

        const grouped = new Map()

        for (const row of result.rows) {
            const userId = row.id

            if (!grouped.has(userId)) {
                grouped.set(userId, {
                    user_id: row.id,
                    full_name: row.full_name,
                    email: row.email,
                    status: row.user_status,
                    overdue: 0,
                    created_at: row.created_at,
                    reservations: []
                })
            }

            if (row.reservation_id) {
                const user = grouped.get(userId)

                user.reservations.push({
                    id: row.reservation_id,
                    start_time: row.start_time,
                    end_time: row.end_time,
                    status: row.status,
                    equipment: {
                        category: row.category,
                        name: row.equipment_name
                    }
                })

                if (row.status === 'overdue') user.overdue++
            }
        }
        const users = Array.from(grouped.values())

        return users
    },

    restrictUser: async (userId, status) => {
        const changeStatus = await db.query(`
            UPDATE users
            SET status = $1::user_status,
                suspended_at = CASE
                    WHEN $1::text = 'suspended' THEN (NOW() AT TIME ZONE 'Europe/Helsinki')
                    WHEN $1::text = 'active'    THEN NULL
                    ELSE suspended_at
                END,
                last_unsuspended_at = CASE
                    WHEN $1::text = 'active' THEN (NOW() AT TIME ZONE 'Europe/Helsinki')
                    ELSE last_unsuspended_at
                END,
                updated_at = (NOW() AT TIME ZONE 'Europe/Helsinki')
            WHERE id = $2;
        `, [status, userId])

        if (changeStatus.rowCount === 0) {
            throw new Error('No account found.')
        }

        return true
    }
}

module.exports = manageUsersHelper
