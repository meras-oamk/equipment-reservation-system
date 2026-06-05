const { Pool } = require('pg')
require('dotenv').config()

const db = new Pool({
    // user: process.env.DB_USER,
    // host: process.env.DB_HOST,
    // database: process.env.DB_DATABASE,
    // password: process.env.DB_PASSWORD,
    // port: process.env.DB_PORT,
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