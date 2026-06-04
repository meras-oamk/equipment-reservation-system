const express = require('express')
const cors = require('cors')
const { connectDB } = require('../database/db')
const authRoute = require('./routes/auth')

require('dotenv').config()
const app = express()

connectDB()

app.use(express.json())
app.use(cors())

app.use('/api/auth', authRoute)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})