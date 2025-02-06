const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const User = require('../models/user')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_secret: process.env.SECRET_API_KEY,
    api_key: process.env.API_KEY

})
// post request occur when data send from frontend as body
// signup

router.post('/signup', (req, res) => {
    User.find({ email: req.body.email })
        .then(users => {
            if (users.length > 0) {
                return res.status(500).json({
                    msg: "This email has already been used"
                })
            }
            else {
                cloudinary.uploader.upload(req.files.image.tempFilePath, (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // console.log(result);
                        bcrypt.hash(req.body.password, 10, (err, hash) => {
                            if (err) {
                                return res.status(500).json({
                                    msg: "password not bcrypted properly"
                                })
                            }
                            else {
                                const newUser = new User({
                                    _id: new mongoose.Types.ObjectId,
                                    fullName: req.body.fullName,
                                    email: req.body.email,
                                    phone: req.body.phone,
                                    password: hash,
                                    imageUrl: result.secure_url,
                                    imageId: result.public_id,
                                })
                                newUser.save().then(result => {
                                    res.status(200).json({
                                        msg: "new data added",
                                        newstudent: result
                                    })
                                })
                                    .catch((error) => {
                                        console.log(error)
                                        res.status(500).json({
                                            msg: "something wrong"
                                        })
                                    })

                            }
                        })



                    }
                })
            }
        })

})

// login page
router.post('/login', (req, res) => {
    User.find({ email: req.body.email })
        .then(users => {
            if (users.length > 0) {
                bcrypt.compare(req.body.password, users[0].password, (error, result) => {
                    if (!result) {
                        console.log(error);
                        return res.status(500).json({
                            msg: "wrong password"
                        })
                    }
                    else {
                        const token = jwt.sign({
                            email: users[0].email,
                            fullName:users[0].fullName,
                            uId: users[0]._id,
                        },
                            'my first project',
                            {
                                expiresIn: '365d'
                            }
                        );
    
                        res.status(200).json({
                            fullName:users[0].fullName,
                            email: users[0].email,
                            imageUrl : users[0].imageUrl,
                            imageId : users[0].imageId,
                            token: token,
                            id:users[0]._id
                            
                        })
                    }

                  
                })
            }
            else {
                return res.status(404).json({
                    msg: "invalid email Please write again"
                })
            }
        })
})



module.exports = router;