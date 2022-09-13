const express = require('express');
const teacherModel = require('../models/teacher.model')
const quizModel = require('../models/quiz.model')
const questionModel = require('../models/question.model')
const router = express.Router()


router.post('/create', async (req, res) => {
    const { title, topic } = req.body
    if (!title || !topic) return res.status(400).json({ error: 'Both fields are required' }) 
    const newQuiz = await quizModel({ title, topic, teacherId: req.payload._id })
    try {
        const savedQuiz = await newQuiz.save()
        res.status(202).json({alert: "Quiz created successfully, Now add some questions"})
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


router.get('/delete/:quizId', async (req, res) => {
    try {
        const existingQuestion = await quizModel.deleteOne({ _id: req.params.quizId })
        const updateQuestion = await questionModel.deleteMany({ quizId: req.params.quizId })
        res.status(202).json({ alert: "Quiz deleted successfully" })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})




module.exports = router