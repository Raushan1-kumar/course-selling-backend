const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/checkAuth');
const Course = require('../models/Course');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// add new-course api
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_secret: process.env.SECRET_API_KEY,
    api_key: process.env.API_KEY
})


//add new course api
router.post('/add-course', checkAuth, (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');
        console.log("Verified Data:", verifiedData);

        if (!req.files || !req.files.image) {
            return res.status(400).json({ msg: "Image file is required" });
        }

        const file = req.files.image;
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
            return res.status(400).json({ msg: "Invalid file type. Please upload an image file." });
        }

        cloudinary.uploader.upload(file.tempFilePath)
            .then(result => {
                console.log("Cloudinary Upload Result:", result);

                const newCourse = new Course({
                    _id: new mongoose.Types.ObjectId(),
                    courseName: req.body.courseName,
                    price: req.body.price,
                    description: req.body.description,
                    startingDate: req.body.startingDate,
                    endingDate: req.body.endingDate,
                    uId: verifiedData.uId,
                    thumbnail: result.secure_url,
                    thumbnailId: result.public_id,
                });

                return newCourse.save();
            })
            .then(savedCourse => {
                console.log("Course Saved Successfully:", savedCourse);
                res.status(200).json({
                    msg: "New course added",
                    newcourse: savedCourse,
                });
            })
            .catch(err => {
                console.error("Error in /add-course:", err);
                res.status(500).json({ msg: "Something went wrong", error: err });
            });
    } catch (err) {
        console.error("Error in /add-course:", err);
        res.status(500).json({ msg: "Something went wrong", error: err });
    }
});


// Access any particular courses api
router.get('/course-detail/:id',checkAuth, (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project');
    
    Course.findById(req.params.id)
    .select('_id uId courseName price description startingDate endingDate thumbnail thumbnailId')
    .then(result=>{
       Student.find({courseId:req.params.id})
       .select('fullName phone email address imageurl')
       .then(student=>{
        res.status(200).json({
            course:result,
            students:student
        })
       })
       .catch(err=>{
        res.status(500).json({
            msg:"error occur while accessing student data",
            error:err
        })
       })
    })
    .catch(error=>{
            res.status(404).json({
                msg:"you don't have access of any courses",
            })
        })
})

//Access all courses
router.get('/all-course',checkAuth, (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project');
    
    Course.find({uId:verifiedData.uId})
    .select('_id uId courseName price description startingDate endingDate thumbnail thumbnailId')
    .then(result=>{
        res.status(200).json({
            course:result,
        })
       })
       .catch(err=>{
        res.status(500).json({
            msg:"error occur while accessing student data",
            error:err
        })
       })
    .catch(error=>{
            res.status(404).json({
                msg:"you don't have access of any courses",
            })
        })
})

router.get('/all-courses', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');

        const courses = await Course.find({uId:verifiedData.uId}).lean();

        // Fetch student count for each course
        const coursesWithStudentCount = await Promise.all(
            courses.map(async (course) => {
                const studentCount = await Student.countDocuments({ courseId: course._id });
                return {
                    ...course,
                    studentCount,
                };
            })
        );

        res.status(200).json({
            courses: coursesWithStudentCount,
        });
    } catch (err) {
        console.error("Error fetching courses:", err);
        res.status(500).json({
            message: "Failed to fetch courses",
        });
    }
});

router.get('/course-count/:id', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');

        // Count students by courseId
        const courseCount = await Course.countDocuments({ uId: req.params.id });
        res.status(200).json({
            data:courseCount,
        });
    } catch (err) {
        console.error("Error fetching student count:", err);
        res.status(500).json({
            msg: "An error occurred while retrieving the student count.",
            error: err.message,
        });
    }
});



// delete any courses and their image from cloudinary
router.delete('/delete-course/:id',checkAuth,(req, res)=>{
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project');

   Course.findById(req.params.id)
   .then(course=>{
    console.log(course);
    if(course.uId== verifiedData.uId){
         Course.findByIdAndDelete(req.params.id)
         .then(result=>{
                cloudinary.uploader.destroy(course.thumbnailId,(result)=>{
                    res.status(200).json({
                        msg:"image has been deleted from cloudinary",
                        detail: result,
                    })
                })         })
         .catch(error=>{
            res.status(500).json({
                msg:"there is problem while deleting"
            })
         })
    }
    else{
        res.status(500).json({
            msg:"bad request",
        })
    }
   })
})

// update data of courses for update we use two methods  PUT AND PATCH
// if you use PUT then you have to send all data from frontend while if you use PATCH then only required data you can take from frontend and update that 

router.put("/update-course/:id", checkAuth, (req, res)=>{
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project');

    const course=Course.findById(req.params.id)
    .then(result=>{
        if(result.uId != verifiedData.uId){
            return res.status(500).json({
                msg:"you are not eligible to change"
            })
        }
       if(req.files){
        cloudinary.uploader.destroy(course.thumbnailId,(result)=>{
            console.log(result);

        cloudinary.uploader.upload(req.files.image.tempFilePath,(err,result)=>{
            console.log(result)
            const updateData={
                courseName: req.body.courseName,
                price: req.body.price,
                description: req.body.description,
                startingDate: req.body.startingDate,
                endingDate: req.body.endingDate,
                uId: verifiedData.uId,
                thumbnail: result.secure_url,
                thumbnailId: result.public_id,
            }
            Course.findByIdAndUpdate(req.params.id, updateData,{new:true})
            .then(result=>{
                res.status(200).json({
                    msg:"data updated successfully",
                    data:result
                })
            })
            .catch(error=>{
                res.status(500).json({
                    msg:"having difficulty during updating data"
                })
            })
            
        })
    }) 
       }
       else{
        const updateData={
            courseName: req.body.courseName,
            price: req.body.price,
            description: req.body.description,
            startingDate: req.body.startingDate,
            endingDate: req.body.endingDate,
            uId: verifiedData.uId,
            thumbnail: course.thumbnail,
            thumbnailId: course.thumbnailId,
        }
        Course.findByIdAndUpdate(req.params.id, updateData,{new:true})
        .then(result=>{
            res.status(200).json({
                msg:"data updated successfully",
                data:result
            })
        })
        .catch(error=>{
            res.status(500).json({
                msg:"having difficulty during updating data"
            })
        })
       }
    })
    .catch(error=>{
        res.status(500).json({
            msg:"there is problem occur while accessing by using id"
        })
    })

})

// accessing recent add five courses
router.get('/recent-courses',checkAuth,(req, res)=>{
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project');
    Course.find({uId:verifiedData.uId})
    .sort({$natural:-1}).limit(5)
    .then(result=>{
        res.status(200).json({
            msg:"done access 5 recent student",
            courses:result,
        })
    })
    .catch(err=>{
        res.status(500).json({
            msg:"something wrong while sorting recent 5 courses",
            error:err
        })
    })
})

module.exports = router;
