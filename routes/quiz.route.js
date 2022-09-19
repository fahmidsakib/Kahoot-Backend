const express = require('express');
const teacherModel = require('../models/teacher.model')
const quizModel = require('../models/quiz.model')
const reportModel = require('../models/report.model')
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
        res.status(202).json({ data: savedQuiz._id, alert: "Quiz created successfully, Now add some questions" })
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
                { $pull: { quizId: req.params.quizId } })
            res.status(200).json({ alert: "Quiz deleted successfully" })
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


router.post('/save-quiz-reports', async (req, res) => {
    const { quizId, result, totalQue } = req.body
    if (!quizId || !result || !totalQue) return res.status(400).json({ error: 'All fields are required' })
    const newReport = await reportModel({ quizId, result, teacherId: req.payload._id, totalQue })
    try {
        const savedReport = await newReport.save()
        res.status(202).json({ alert: "Report saved successfully" })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


router.get('/report', async (req, res) => {
    try {
        const reports = await reportModel.find({ teacherId: req.payload._id })
            .populate('teacherId', 'name').populate('quizId')
        res.status(200).json({ data: reports })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


router.delete('report/delete/:reportId', async (req, res) => {
    try {
        const existingReports = await reportModel.deleteOne({ _id: req.params.reportId })
        res.status(200).json({ alert: "Report deleted successfully" })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


router.post('/update-question-order', async (req, res) => {
    const { questions, quizId } = req.body
    let updatedQuestion = []
    questions.forEach((question) => updatedQuestion.push(question._id))
    const quiz = await quizModel.find({ _id: quizId })
    quiz[0].questionsId = updatedQuestion
    try {
        await quizModel.updateOne({ _id: quizId }, quiz[0])
        res.status(200).json({ alert: "Question order updated successfully" })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


module.exports = router