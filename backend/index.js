const express = require('express')
const cors = require('cors')
const path = require('path')
const { connectDB } = require('./helpers/db')
const authRoute = require('./routes/auth')

require('dotenv').config()
const app = express()

connectDB()

app.use(express.json())
app.use(cors())

app.use(express.static(path.join(__dirname,'../frontend')))

app.use('/api/auth', authRoute)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/index.html'))
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})