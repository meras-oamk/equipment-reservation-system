const express = require('express')
const cors = require('cors')
const path = require('path')
const { connectDB } = require('./helpers/db')
const authRoute = require('./routes/auth')
const equipmentRoute = require('./routes/equipment')
<<<<<<< HEAD
const reservationsRoute = require('./routes/reservations')
=======
const settingsRoute = require('./routes/settings')
const logsRoute = require('./routes/logs')
>>>>>>> origin/development
require('dotenv').config()
const app = express()

connectDB()

app.use(express.json())
app.use(cors())

app.use('/api/auth', authRoute)
app.use('/api/equipment', equipmentRoute)
<<<<<<< HEAD
app.use('/api/reservation', reservationsRoute)
=======
app.use('/api/settings', settingsRoute)
app.use('/api/logs', logsRoute)
>>>>>>> origin/development

app.use(express.static(path.join(__dirname,'../frontend')))
app.use(express.static(path.join(__dirname, '../frontend/html')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/index.html'))
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})
