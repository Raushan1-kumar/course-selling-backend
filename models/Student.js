const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
     fullName:{
        type:String,
        required:true,
     },
     phone:{
        type:String,
        required:true,
     },
     email:{
        type:String,
        required: true,
     },
     address:{
         type: String,
         require: true,
     },
     
     imageurl:{
        type: String,
        required: true,
     },
     imageId:{
        type:String,
        required: true
     },
     courseId:{
        type:String,
        required: true,
     },
     uId:{
        type:String,
        required:true,
     },
     dateOfJoining: { type: Date, default: Date.now },
},{timestamps:true})

module.exports = mongoose.model('Student', studentSchema)