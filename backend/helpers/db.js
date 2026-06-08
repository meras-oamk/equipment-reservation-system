const { Pool } = require('pg')
require('dotenv').config()

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
})

const connectDB = async () => {
    try {
        await db.connect()
        console.log('Connected to database')
    } catch (error) {
        console.error('Error connecting to database:', error.message)
    }
}

module.exports = { db, connectDB }