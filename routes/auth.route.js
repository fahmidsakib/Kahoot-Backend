const express = require('express');
const teacherModel = require('../models/teacher.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const router = express.Router()


router.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body
    if (!name || !email || !password || !confirmPassword) return res.status(400).json({ error: 'All field are required' })
    const existingUser = await teacherModel.findOne({ email: email.toLowerCase() })
    if (existingUser !== null) return res.status(400).json({ error: 'Email already exists' })
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const newUser = new teacherModel({ name, email: email.toLowerCase(), password: hash })
    try {
        const savedUser = await newUser.save()
        let payload = JSON.parse(JSON.stringify(savedUser))
        delete payload.password
        res.status(201).json({ data: payload })
    } catch (error) {
        res.status(501).json({ error: error.message })
    }
})


router.post('/signin', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Both fields are required' })
    const existingUser = await teacherModel.findOne({ email: email.toLowerCase() })
    if (existingUser === null) return res.status(400).json({ error: 'User does not exists' })
    const passwordCheck = bcrypt.compareSync(password, existingUser.password)
    if (passwordCheck) {
        let payload = JSON.parse(JSON.stringify(existingUser))
        delete payload.password
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME })
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME })
        return res.status(200).json({ data: { refreshToken, accessToken, payload } })
    }
    else return res.status(400).json({error: 'Wrong password'})
})


router.post('/token', async (req, res) => {
    const refreshToken = req.body.refreshToken
    try {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        delete payload.exp
        delete payload.iat
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME })
        return res.status(200).json({ data: accessToken })
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token provided' })
    }
})


module.exports = router