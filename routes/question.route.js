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
    const { que, type, correctAns } = req.body
    if (!que || !type || !correctAns) return res.status(400).json({ error: 'All fields are required' })

    let imageUrl = ''
    if (req.file !== undefined) {
        imageUrl = process.env.BASE_URL + 'uploads/' + req.file.filename
    }

    if (type === 'mcq') {
        const { choice1, choice2, choice3, choice4 } = req.body
        if (!choice1 && !choice2 && !choice3 && !choice4) return res.status(400).json({ error: 'You must provide 4 options' })
        const newQuestion = await questionModel({ que, type, choice1, choice2, choice3, choice4, correctAns, imageUrl })
    }
    else {
        const newQuestion = await questionModel({ que, type, correctAns, imageUrl })
    }
    
    try {
        const savedQuestion = await newQuestion.save()
        res.status(201).json({alert: 'New question added successfully'})
    } catch (error) {
        res.status(501).json({error: error.message})
    }
})


module.exports = router