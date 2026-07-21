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
                'W' || TO_CHAR(w.week_start, 'IW') AS week_label,
                TO_CHAR(w.week_start, 'YYYY-MM-DD') AS week_start,
                COUNT(r.id) AS reservation_count
            FROM weeks w
            LEFT JOIN reservations r
                ON DATE_TRUNC('week', r.start_time)::date = w.week_start::date
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
            FROM equipment_types et
            LEFT JOIN reservations r
                ON r.type_id = et.id
            AND r.status <> 'cancelled'
            GROUP BY et.category
            ORDER BY reservation_count DESC;
        `)

        return categoryPopularity.rows
    },

    loanOutcomes: async () => {
        const loanOutcomes = await db.query(`
            SELECT
                s.status::text AS status,
                COUNT(r.id) AS total_reservations
            FROM unnest(enum_range(NULL::reservation_status)) AS s(status)
            LEFT JOIN reservations r
                ON r.status = s.status
            GROUP BY s.status

            UNION ALL

            SELECT
                'total' AS status,
                COUNT(*) AS total_reservations
            FROM reservations;
        `)

        return loanOutcomes.rows
    },

    weeklyLoad: async () => {
        const weeklyLoad = await db.query(`
            SELECT
                TO_CHAR(d.day, 'Dy DD') AS day,
                COUNT(r.id) AS due_returns
            FROM generate_series(
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '6 days',
                INTERVAL '1 day'
            ) AS d(day)
            LEFT JOIN reservations r
                ON r.return_time IS NULL
            AND r.status NOT IN ('cancelled', 'overdue')
            AND r.end_time >= d.day
            AND r.end_time < d.day + INTERVAL '1 day'
            GROUP BY d.day
            ORDER BY d.day;
        `)

        return weeklyLoad.rows
    },

    avgDuration: async () => {
        const avgDuration = await db.query(`
            SELECT
                et.category,
                COALESCE(
                    ROUND(
                        AVG(
                            EXTRACT(EPOCH FROM (r.return_time - r.checkout_time)) / 3600
                        )::numeric,
                        1
                    ),
                    0
                ) AS avg_days
            FROM equipment_types et
            LEFT JOIN reservations r
                ON r.type_id = et.id
            AND r.status = 'completed'
            AND r.checkout_time IS NOT NULL
            AND r.return_time IS NOT NULL
            GROUP BY et.category
            ORDER BY avg_days DESC;
        `)

        return avgDuration.rows
    }

}

module.exports = statisticsHelper