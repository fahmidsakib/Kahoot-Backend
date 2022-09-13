require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))

mongoose.connect('mongodb+srv://FahmidSakib:1234@kahoot.grpqwro.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to DB"))
    .catch((err) => console.error("Error", err))


app.use(express.static('public'))
app.use(express.json())
app.use(morgan('dev'))




app.listen(process.env.PORT || 8000)