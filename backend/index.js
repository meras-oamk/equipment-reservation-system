const express = require('express')
const cors = require('cors')
const { connectDB } = require('../database/db')
const authRoute = require('./routes/auth')

require('dotenv').config()
const app = express()

connectDB()

app.use(express.json())
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  // methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // allowedHeaders: ['Content-Type', 'Authorization'],
  // credentials: true
}))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/api/auth', authRoute)


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})