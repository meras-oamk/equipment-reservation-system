const { Pool } = require('pg')
require('dotenv').config()

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