const express = require('express');
const teacherModel = require('../models/teacher.model')
const quizModel = require('../models/quiz.model')
const questionModel = require('../models/question.model')
const multer = require('multer')
const router = express.Router()


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const upload = multer({ storage: storage })


router.post('/add', upload.single('image'), async (req, res) => {
    const { que, type, correctAns, quizId } = req.body
    if (!que || !type || !correctAns || !quizId) return res.status(400).json({ error: 'All fields are required' })

    let imageUrl = '', newQuestion
    if (req.file !== undefined) {
        console.log(req.file)
        imageUrl = process.env.BASE_URL + 'uploads/' + req.file.filename
    }

    if (type === 'mcq') {
        const { choice1, choice2, choice3, choice4 } = req.body
        if (!choice1 && !choice2 && !choice3 && !choice4) return res.status(400).json({ error: 'You must provide 4 options' })
        newQuestion = await questionModel({ que, type, quizId, choice1, choice2, choice3, choice4, correctAns, imageUrl })
    }
    else {
        newQuestion = await questionModel({ que, type, quizId, correctAns, imageUrl })
    }

    try {
        const savedQuestion = await newQuestion.save()
        const updateQuiz = await quizModel.updateOne({ _id: quizId },
            { $push: { questionsId: savedQuestion._id } })
        res.status(201).json({ alert: 'New question added successfully' })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


router.delete('/delete/:queId', async (req, res) => {
    try {
        const question = await questionModel.findOne({ _id: req.params.queId })
        const updateQuiz = await quizModel.updateOne({ _id: question.quizId },
            { $pull: { questionsId: req.params.queId } })
        const existingQuestion = await questionModel.deleteOne({ _id: req.params.queId })
        res.status(202).json({ alert: "Question deleted successfully" })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


router.post('/edit/:queId', upload.single('image'), async (req, res) => {

    const getQue = await questionModel.find({ _id: req.params.queId })

    const { que, correctAns} = req.body
    if (!que || !correctAns ) return res.status(400).json({ error: 'All fields are required' })

    let imageUrl = getQue[0].imageUrl
    if (req.file !== undefined) {
        console.log(req.file)
        imageUrl = process.env.BASE_URL + 'uploads/' + req.file.filename
    }

    if (getQue[0].type === 'mcq') {
        const { choice1, choice2, choice3, choice4 } = req.body
        if (!choice1 && !choice2 && !choice3 && !choice4) return res.status(400).json({ error: 'You must provide 4 options' })
        getQue[0].que = que
        getQue[0].correctAns = correctAns
        getQue[0].choice1 = choice1
        getQue[0].choice2 = choice2
        getQue[0].choice3 = choice3
        getQue[0].choice4 = choice4
        getQue[0].imageUrl = imageUrl
    }
    else {
        getQue[0].que = que
        getQue[0].correctAns = correctAns
        getQue[0].imageUrl = imageUrl
    }

    try {
        await questionModel.updateOne({ _id: req.params.queId }, getQue[0])
        res.status(200).json({ alert: "Question updated successfully" })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


module.exports = router