require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const {Server} = require('socket.io') 
const authRouter = require('./routes/auth.route')
const questionRouter = require('./routes/question.route')
const quizRouter = require('./routes/quiz.route')

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))


mongoose.connect(process.env.DB, {
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
app.use('/question', questionRouter)
app.use('/quiz', quizRouter)


const httpServer = app.listen(process.env.PORT || 8000)
const io = new Server(httpServer, { cors: { origin: "*" } })


io.on('connection', (socket) => {
    console.log("Client connected " + socket.id)



    socket.on('disconnect', () => console.log("Client disconnected"))
})


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