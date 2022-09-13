const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        quizId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'quiz' }]
    },
    { timestamps: true })

const teacherModel = mongoose.model('teacher', teacherSchema)
module.exports = teacherModel