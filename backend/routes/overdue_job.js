const cron = require('node-cron')
const { db } = require('../helpers/db')
const sendEmail = require('../helpers/email')

// Runs every 15 minutes.
// Marks active reservations past their end_time as overdue,
// then sends a one-time email notification to each affected user.
cron.schedule('*/15 * * * *', async () => {
    try {
        // Mark overdue and fetch user + equipment details in one query
        const result = await db.query(`
            WITH updated AS (
                UPDATE reservations
                SET status = 'overdue'
                WHERE status = 'active'
                  AND end_time < (NOW() AT TIME ZONE 'Europe/Helsinki')
                RETURNING id, user_id, type_id, end_time
            )
            SELECT
                u.id              AS reservation_id,
                u.end_time,
                us.email,
                us.full_name,
                et.name           AS equipment_name
            FROM updated u
            JOIN users          us ON us.id = u.user_id
            JOIN equipment_types et ON et.id = u.type_id
        `)

        if (result.rows.length > 0) {
        for (const row of result.rows) {
            await sendEmail({
                to: row.email,
                subject: 'Action Required: Overdue Equipment Return',
                html: `
                    <p>Dear ${row.full_name},</p>

                    <p>
                        Your reservation for <strong>${row.equipment_name}</strong>
                        was due back on <strong>${row.end_time}</strong> (Helsinki time)
                        but has not been returned yet.
                    </p>

                    <p>
                        Please return the equipment as soon as possible.
                        Continued failure to return equipment on time may result in
                        your account being suspended.
                    </p>

                    <p>
                        If you have already returned the equipment or need assistance,
                        please contact the equipment desk immediately.
                    </p>

                    <p>
                        Thank you,<br/>
                        MERAS — Equipment Reservation System<br/>
                        Oulu University of Applied Sciences
                    </p>
                `
            })

            await db.query(`
                UPDATE reservations
                SET overdue_notified_at = (NOW() AT TIME ZONE 'Europe/Helsinki')
                WHERE id = $1
            `, [row.reservation_id])
        }

        console.log(`[overdue_job] Marked ${result.rows.length} reservation(s) as overdue.`)

        } // end if (result.rows.length > 0)

        // ── Suspend check ──────────────────────────────────────────────────────

        // Read suspend_after threshold from system_settings
        const settingsResult = await db.query(`
            SELECT (value->>'suspend_after')::int AS suspend_after
            FROM system_settings
            WHERE key = 'late_return_policy'
        `)
        const suspendAfter = settingsResult.rows[0]?.suspend_after ?? 3

        // Process each affected user once (deduplicate by user_id)
        const affectedUserIds = [...new Set(result.rows.map(r => r.user_id))]

        for (const userId of affectedUserIds) {
            // Count all-time overdue reservations for this user
            // Use overdue_notified_at IS NOT NULL so completed/returned reservations
            // that were once overdue still count toward the user's history.
            const countResult = await db.query(`
                SELECT COUNT(*) AS overdue_count
                FROM reservations
                WHERE user_id = $1 AND overdue_notified_at IS NOT NULL
            `, [userId])

            const overdueCount = parseInt(countResult.rows[0].overdue_count, 10)

            if (overdueCount >= suspendAfter) {
                // Only suspend if currently active (avoid double-suspend)
                const suspendResult = await db.query(`
                    UPDATE users
                    SET status = 'suspended', suspended_at = NOW(), updated_at = NOW()
                    WHERE id = $1 AND status = 'active'
                    RETURNING full_name, email
                `, [userId])

                if (suspendResult.rows.length > 0) {
                    const { full_name, email } = suspendResult.rows[0]

                    await sendEmail({
                        to: email,
                        subject: 'Account Suspended — Overdue Equipment Returns',
                        html: `
                            <p>Dear ${full_name},</p>

                            <p>
                                Your MERAS account has been <strong>suspended</strong>
                                due to ${overdueCount} overdue equipment return(s).
                            </p>

                            <p>
                                While suspended, you will not be able to make new reservations.
                                Any equipment currently in your possession must still be returned
                                immediately.
                            </p>

                            <p>
                                If you believe this is a mistake or need further assistance,
                                please contact the equipment desk.
                            </p>

                            <p>
                                Thank you,<br/>
                                MERAS — Equipment Reservation System<br/>
                                Oulu University of Applied Sciences
                            </p>
                        `
                    })

                    console.log(`[overdue_job] Suspended user ${email} after ${overdueCount} overdue return(s).`)
                }
            }
        }

        // ── Unsuspend check ────────────────────────────────────────────────────

        // Read restriction_days from system_settings
        const restrictionResult = await db.query(`
            SELECT (value->>'restriction_days')::int AS restriction_days
            FROM system_settings
            WHERE key = 'late_return_policy'
        `)
        const restrictionDays = restrictionResult.rows[0]?.restriction_days ?? 60

        const unsuspendResult = await db.query(`
            UPDATE users
            SET status = 'active', suspended_at = NULL, updated_at = NOW()
            WHERE status = 'suspended'
              AND suspended_at < NOW() - ($1 || ' days')::INTERVAL
            RETURNING full_name, email
        `, [restrictionDays])

        for (const user of unsuspendResult.rows) {
            await sendEmail({
                to: user.email,
                subject: 'Your MERAS Account Has Been Reactivated',
                html: `
                    <p>Dear ${user.full_name},</p>

                    <p>Your MERAS account has been reactivated. You can now make new equipment reservations.</p>

                    <p>
                        Please note that further late returns may result in longer booking restrictions
                        or permanent suspension of your account.
                    </p>

                    <p>
                        If you have any questions, please contact the equipment desk.
                    </p>

                    <p>
                        Thank you,<br/>
                        MERAS — Equipment Reservation System<br/>
                        Oulu University of Applied Sciences
                    </p>
                `
            })

            console.log(`[overdue_job] Reactivated user ${user.email} after ${restrictionDays}-day restriction.`)
        }

    } catch (error) {
        console.error('[overdue_job] Error:', error.message)
    }
})
