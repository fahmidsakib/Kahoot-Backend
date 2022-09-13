const express = require('express');
const teacherModel = require('../models/teacher.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const router = express.Router()





module.exports = router