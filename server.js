require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { Server } = require('socket.io')
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

let quizRoomArr = []

io.on('connection', (socket) => {
    console.log("Client connected " + socket.id)

    socket.on('createRoom', (obj) => {
        let quizRoom = {
            roomId: obj.roomId,
            quizId: obj.quizId,
            teacherId: obj.socketId,
            questions: obj.questions,
            queIndex: -1,
            start: false,
            studentsArr: []
        }
        quizRoomArr.push(quizRoom)
    })

    socket.on('joinRoom', (obj) => {
        let index = quizRoomArr.findIndex((el) => el.roomId === obj.roomId)
        if (index !== -1 && !quizRoomArr[index].start) {
            io.to(obj.socketId).emit('joiningConfirm')
        }
        io.to(obj.socketId).emit('joiningRejected')
    })

    socket.on('addNewStudent', (obj) => {
        let index = quizRoomArr.findIndex((el) => el.roomId === obj.roomId)
        if (index !== -1 && !quizRoomArr[index].start) {
            let copyStudents = JSON.parse(JSON.stringify(quizRoomArr[index].studentsArr))
            let newStudent = {
                name: obj.name,
                socketId: obj.socketId,
                selectedAns: {},
                score: 0,
            }
            copyStudents.push(newStudent)
            quizRoomArr[index].studentsArr = copyStudents
            io.to(quizRoomArr[index].teacherId).emit('newStudentJoin', quizRoomArr[index].studentsArr)
            io.to(obj.socketId).emit('waitForOthers')
        }
    })

    socket.on('kick', (obj) => {
        let index = quizRoomArr.findIndex((el) => el.roomId === obj.roomId)
        if (index !== -1) {
            let stuIndex = quizRoomArr[index].studentsArr.findIndex((el) => el.socketId === obj.id)
            if (stuIndex !== -1) {
                io.to(quizRoomArr[index].studentsArr[stuIndex].socketId).allSockets('removed')
                quizRoomArr[index].studentsArr.splice(stuIndex, 1)
                io.to(quizRoomArr[index].teacherId).emit('newStudentJoin', quizRoomArr[index].studentsArr)
            }
        }
    })

    socket.on('nextQue', (roomId) => {
        let index = quizRoomArr.findIndex((el) => el.roomId === roomId)
        if (index !== -1) {
            quizRoomArr[index].queIndex += 1
            quizRoomArr[index].start = true
            let copyQue = JSON.parse(JSON.stringify(quizRoomArr[index].questions[quizRoomArr[index].queIndex]))
            io.to(quizRoomArr[index].teacherId).emit('updateQue', copyQue)
            delete copyQue.correctAns
            quizRoomArr[index].studentsArr.forEach(el => { io.to(el.socketId).emit('updateQue', copyQue) })
        }
    })

    socket.on('submitAns', (obj) => {
        let index = quizRoomArr.findIndex((el) => el.roomId === obj.roomId)
        if (index !== -1) {
            let stuIndex = quizRoomArr[index].studentsArr.findIndex(el => el.socketId === obj.socketId)
            if (stuIndex !== -1) {
                if (quizRoomArr[index].questions[quizRoomArr[index].queIndex].correctAns === obj.ans) quizRoomArr[index].studentsArr[stuIndex].score += 1
                quizRoomArr[index].studentsArr[stuIndex].selectedAns[quizRoomArr[index].queIndex] = obj.ans
                io.to(quizRoomArr[index].studentsArr[stuIndex].socketId).emit('getAnswer', quizRoomArr[index].questions[quizRoomArr[index].queIndex].correctAns)
                io.to(quizRoomArr[index].teacherId).emit('updateStudentsArr', quizRoomArr[index].studentsArr)
            }
        }
    })

    socket.on('showRes', (roomId) => {
        let index = quizRoomArr.findIndex((el) => el.roomId === roomId)
        if (index !== -1) { 
            quizRoomArr[index].studentsArr.forEach(el => { io.to(el.socketId).emit('showRes') })
        }
    })

    socket.on('disconnect', () => {
        let index = quizRoomArr.findIndex((el) => el.teacherId === socket.id)
        if (index !== -1) {
            console.log("Client disconnected and Room info will be deleted for room id " + quizRoomArr[index].roomId)
            quizRoomArr.splice(index, 1)
        }
        console.log('Client disconnected')
    })
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