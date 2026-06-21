const { db } = require('./db')

const statisticsHelper = {
    inventoryUtilization: async () => {
        const utilization = await db.query(`
            SELECT 
                COUNT(id) AS total_units,
                COUNT(CASE WHEN status IN ('checked_out') THEN 1 END) AS active_units,
                COALESCE(
                    ROUND(
                        (
                          COUNT(*) FILTER (WHERE status = 'checked_out')::numeric
                          / NULLIF(COUNT(id), 0)
                        ) * 100,
                        1
                    ), 
                    0
                ) AS utilization_rate
            FROM equipment_units;
        `)

        return utilization.rows[0]
    },

    demandTrends: async () => {
        const demandTrends = await db.query(`
            WITH weeks AS (
                SELECT generate_series(
                    DATE_TRUNC('week', NOW()) - INTERVAL '7 weeks',
                    DATE_TRUNC('week', NOW()),
                    INTERVAL '1 week'
                ) AS week_start
            )

            SELECT 
            TO_CHAR(w.week_start, 'YYYY-MM-DD') AS week_start,
            COUNT(r.id) AS reservation_count
            FROM weeks w
            LEFT JOIN reservations r
            ON DATE_TRUNC('week', r.start_time) = w.week_start
            AND r.status != 'cancelled'
            GROUP BY w.week_start
            ORDER BY w.week_start;
        `)

        return demandTrends.rows
    },

    popularity: async () => {
        const categoryPopularity = await db.query(`
            SELECT 
                et.category,
                COUNT(r.id) AS reservation_count
            FROM reservations r
            JOIN equipment_types et ON r.type_id = et.id
            WHERE r.status NOT IN ('cancelled')
            GROUP BY et.category
            ORDER BY reservation_count DESC;
        `)

        return categoryPopularity.rows
    }
}

module.exports = statisticsHelper