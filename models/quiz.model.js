const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        topic: { type: String, required: true },
        teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'teacher' },
        questionsId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'question' }]
    },
    { timestamps: true })

const quizModel = mongoose.model('quiz', quizSchema)
module.exports = quizModel