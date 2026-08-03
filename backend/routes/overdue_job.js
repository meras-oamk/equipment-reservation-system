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
                u.user_id,
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

        // ── Suspend & Ban check ──────────────────────────────────────────────────────

        // Read suspend_after threshold from system_settings
        const settingsResult = await db.query(`
            SELECT (value->>'suspend_after')::int AS suspend_after
            FROM system_settings
            WHERE key = 'late_return_policy'
        `)
        const suspendAfter = settingsResult.rows[0]?.suspend_after ?? 3

        // BAN users who have > 4 late returns since their last unsuspend date
        const usersToBan = await db.query(`
            SELECT u.id, u.full_name, u.email, COUNT(r.id) AS overdue_count
            FROM users u
            JOIN reservations r ON r.user_id = u.id
            WHERE u.status != 'banned'
              AND r.overdue_notified_at IS NOT NULL
              AND r.overdue_notified_at > COALESCE(u.last_unsuspended_at, '1970-01-01'::timestamp)
            GROUP BY u.id, u.full_name, u.email
            HAVING COUNT(r.id) > 4
        `)

        for (const row of usersToBan.rows) {
            const banResult = await db.query(`
                UPDATE users
                SET status = 'banned',
                    updated_at = (NOW() AT TIME ZONE 'Europe/Helsinki')
                WHERE id = $1 AND status != 'banned'
                RETURNING full_name, email
            `, [row.id])

            if (banResult.rows.length > 0) {
                const { full_name, email } = banResult.rows[0]
                await sendEmail({
                    to: email,
                    subject: 'Account Permanently Banned — Excessive Overdue Returns',
                    html: `
                        <p>Dear ${full_name},</p>
                        <p>Your MERAS account has been <strong>permanently banned</strong> due to having ${row.overdue_count} overdue equipment returns.</p>
                        <p>You will no longer be able to make reservations or access your account.</p>
                        <p>Thank you,<br/>MERAS — Equipment Reservation System</p>
                    `
                })
                console.log(`[overdue_job] Banned user ${email} after ${row.overdue_count} overdue return(s).`)
            }
        }

        // SUSPEND active users who have >= suspendAfter late returns since last unsuspend date
        const usersToSuspend = await db.query(`
            SELECT u.id, u.full_name, u.email, COUNT(r.id) AS overdue_count
            FROM users u
            JOIN reservations r ON r.user_id = u.id
            WHERE u.status = 'active'
              AND r.overdue_notified_at IS NOT NULL
              AND r.overdue_notified_at > COALESCE(u.last_unsuspended_at, '1970-01-01'::timestamp)
            GROUP BY u.id, u.full_name, u.email
            HAVING COUNT(r.id) >= $1
        `, [suspendAfter])

        for (const row of usersToSuspend.rows) {
            const suspendResult = await db.query(`
                UPDATE users
                SET status = 'suspended',
                    suspended_at = (NOW() AT TIME ZONE 'Europe/Helsinki'),
                    updated_at = (NOW() AT TIME ZONE 'Europe/Helsinki')
                WHERE id = $1 AND status = 'active'
                RETURNING full_name, email
            `, [row.id])

            if (suspendResult.rows.length > 0) {
                const { full_name, email } = suspendResult.rows[0]
                await sendEmail({
                    to: email,
                    subject: 'Account Suspended — Overdue Equipment Returns',
                    html: `
                        <p>Dear ${full_name},</p>
                        <p>Your MERAS account has been <strong>suspended</strong> due to ${row.overdue_count} overdue equipment return(s).</p>
                        <p>While suspended, you will not be able to make new reservations.</p>
                        <p>Thank you,<br/>MERAS — Equipment Reservation System</p>
                    `
                })
                console.log(`[overdue_job] Suspended user ${email} after ${row.overdue_count} overdue return(s).`)
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
            SET status = 'active',
                suspended_at = NULL,
                last_unsuspended_at = (NOW() AT TIME ZONE 'Europe/Helsinki'),
                updated_at = (NOW() AT TIME ZONE 'Europe/Helsinki')
            WHERE status = 'suspended'
              AND suspended_at < (NOW() AT TIME ZONE 'Europe/Helsinki') - ($1 * INTERVAL '1 day')
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
