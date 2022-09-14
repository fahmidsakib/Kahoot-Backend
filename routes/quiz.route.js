const express = require('express');
const teacherModel = require('../models/teacher.model')
const quizModel = require('../models/quiz.model')
const questionModel = require('../models/question.model')
const router = express.Router()


router.get('/', async (req, res) => {
    try {
        const quizzes = await teacherModel.findOne({ _id: req.payload._id })
            .populate({
                path: 'quizId', populate: [
                    { path: 'teacherId', model: 'teacher', select: 'name' },
                    { path: 'questionsId', model: 'question' }
                ]
            })
        res.status(200).json({ data: quizzes.quizId })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


router.post('/create', async (req, res) => {
    const { title, topic } = req.body
    if (!title || !topic) return res.status(400).json({ error: 'Both fields are required' })
    const newQuiz = await quizModel({ title, topic, teacherId: req.payload._id })
    try {
        const savedQuiz = await newQuiz.save()
        const updateTeacher = await teacherModel.updateOne({ _id: req.payload._id },
            { $push: { quizId: savedQuiz._id } })
        res.status(202).json({ alert: "Quiz created successfully, Now add some questions" })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


router.delete('/delete/:quizId', async (req, res) => {
    const isValid = await quizModel.findOne({ _id: req.params.quizId })
    if (isValid.teacherId.toString() === req.payload._id) {
        try {
            const existingQuiz = await quizModel.deleteOne({ _id: req.params.quizId })
            const updateQuestion = await questionModel.deleteMany({ quizId: req.params.quizId })
            const updateTeacher = await teacherModel.updateOne({ _id: req.payload._id },
                { $pull: { quizId: savedQuiz._id } })
            res.status(202).json({ alert: "Quiz deleted successfully" })
        } catch (error) {
            res.status(501).json({ error: error.message })
        }
    }
    else return res.status(400).json({ error: "You are not authorized to delete this" })
})


router.get('/get-questions/:quizId', async (req, res) => {
    try {
        const quiz = await quizModel.findOne({ _id: req.params.quizId }).populate('questionsId')
        res.status(200).json({ data: quiz.questionsId })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})



module.exports = router