require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const authRouter = require('./routes/auth.route')
const questionRouter = require('./routes/question.route')
const quizRouter = require('./routes/quiz.route')
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

app.use('/auth', authRouter)
app.use(authenticateRequest)
app.use('/questions', questionRouter)
app.use('/quizzes', quizRouter)


app.listen(process.env.PORT || 8000)

function authenticateRequest(req, res, next) {
    const authHeader = req.headers['authorization']
    if (!authHeader) return res.status(401).json({ error: 'No token provided' })
    const accessToken = authHeader.split(' ')[1]
    if (!accessToken) return res.status(401).json({ error: 'Improper access token provided' })
    try {
        const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        req.payload = payload
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Invalid access token provided' })
    }
}