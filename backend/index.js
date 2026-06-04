const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
const { connectDB } = require('../database/database')

require('dotenv').config()

connectDB()

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})