const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const cors = require('cors');






const userRoute = require('./routes/user');
const courseRoute = require('./routes/courses');
const studentRoute = require('./routes/student');
const feeRoute  = require('./routes/fee');

mongoose.connect('mongodb+srv://raushan:77799@cluster0.i5dsc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(()=>{
  console.log("connected");
}).catch((error)=>{
  console.log("not connected properly "+ error);
})

app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload({
  useTempFiles: true,
  // tempFileDir : '/tmp/'
}));


app.use('/user',userRoute);
app.use('/course',courseRoute);
app.use('/student',studentRoute);
app.use('/fee',feeRoute);

app.use('*',(req,res)=>{
  res.status(404).json({
    msg:"bad request",
  })
})










module.exports = app;