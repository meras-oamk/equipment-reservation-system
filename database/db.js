const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

const connectDB = async () => {
    try {
        await pool.connect()
        console.log('Connected to database')
    } catch (err) {
        console.error('Error connecting to database:', err.message)
    }
}

module.exports = { pool, connectDB}