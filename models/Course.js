const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    courseName:{
        type:String,
        required:true
    },
    price:{
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    startingDate:{
        type: String,
        required:true,
    },
    endingDate:{
        type:String,
        required: true,
    }, 
    uId:{
        type:String,
        required:true,
     },
     thumbnail:{
        type: String,
        required: true,
     },
     thumbnailId:{
        type:String,
        required: true
     },
})

module.exports = mongoose.model('Course', courseSchema)