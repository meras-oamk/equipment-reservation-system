/**
 * Backfill QR codes for existing units that have no qr_code_url.
 * Run once: node scripts/backfill_qr.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { db } = require('../helpers/db')
const { generateAndUploadQR } = require('../helpers/qr')

async function backfill() {
    const { rows: units } = await db.query(`
        SELECT id, qr_code
        FROM equipment_units
        WHERE qr_code_url IS NULL
        ORDER BY id;
    `)

    if (units.length === 0) {
        console.log('Nothing to backfill — all units already have qr_code_url.')
        process.exit(0)
    }

    console.log(`Found ${units.length} unit(s) to backfill.\n`)

    let success = 0
    let failed = 0

    for (const unit of units) {
        try {
            const url = await generateAndUploadQR(unit.qr_code)
            await db.query(
                'UPDATE equipment_units SET qr_code_url = $1, updated_at = NOW() WHERE id = $2',
                [url, unit.id]
            )
            console.log(`  ✓ Unit ${unit.id} (${unit.qr_code})`)
            success++
        } catch (err) {
            console.error(`  ✗ Unit ${unit.id} (${unit.qr_code}): ${err.message}`)
            failed++
        }
    }

    console.log(`\nDone. ${success} success, ${failed} failed.`)
    process.exit(failed > 0 ? 1 : 0)
}

backfill()
