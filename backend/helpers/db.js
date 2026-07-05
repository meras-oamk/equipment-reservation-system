const { Pool, types } = require('pg')
require('dotenv').config()

// Prevent pg from auto-converting "timestamp without time zone" columns into
// JS Date objects. By default, pg interprets these naive timestamps using the
// server process's local timezone, then serializes them back out as UTC ISO
// strings — silently shifting the displayed time (e.g. 08:00 -> 05:00 for a
// server in UTC+3). Returning them as raw strings preserves the exact stored
// value with zero timezone interpretation.
types.setTypeParser(1114, str => str) // 1114 = OID for "timestamp without time zone"

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
})
db.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message)
})

const connectDB = async () => {
    try {
        const client = await db.connect()
        console.log('Connected to database')
        client.release()
    } catch (error) {
        console.error('Error connecting to database:', error.message)
    }
}

module.exports = { db, connectDB }