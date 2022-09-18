const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'teacher', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'quiz', required: true },
    totalQue: {type: Number, required: true},
    result: []
  },
  { timestamps: true })

const resultModel = mongoose.model('report', resultSchema)
module.exports = resultModel