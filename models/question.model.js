const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
    {
        que: { type: String, required: true },
        type: { type: String, required: true },
        imageUrl: { type: String },
        correctAns: { type: String, required: true },
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'quiz', required: true },
        choice1: { type: String },
        choice2: { type: String },
        choice3: { type: String },
        choice4: { type: String }
    },
    { timestamps: true })

const questionModel = mongoose.model('question', questionSchema)
module.exports = questionModel