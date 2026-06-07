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

app.use('/api/auth', authRoute)

app.use(express.static(path.join(__dirname,'../frontend')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/index.html'))
})

app.get('/test-azure', (req, res) => {
  console.log('Backend is running')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})
