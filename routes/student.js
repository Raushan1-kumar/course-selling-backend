const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/checkAuth');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// we use get request to retrieve data from backend
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_secret: process.env.SECRET_API_KEY,
    api_key: process.env.API_KEY
})


// add new student in particular course
router.post('/add-student', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');
        console.log("Verified Data:", verifiedData);

        // Validate that an image file is provided
        if (!req.files || !req.files.image) {
            return res.status(400).json({ msg: "Image file is required" });
        }

        const file = req.files.image;
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
            return res.status(400).json({ msg: "Invalid file type. Please upload an image file." });
        }

        // Validate if the phone number is already in use
        const existingStudent = await Student.findOne({ phone: req.body.phone });
        if (existingStudent) {
            return res.status(400).json({ msg: "Phone number already exists" });
        }

        // Upload the image to Cloudinary
        const result = await cloudinary.uploader.upload(file.tempFilePath);
        console.log("Cloudinary Upload Result:", result);

        // Create and save the new student
        const newStudent = new Student({
            _id: new mongoose.Types.ObjectId(),
            fullName: req.body.fullName,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            imageurl: result.secure_url,
            imageId: result.public_id,
            courseId: req.body.courseId,
            uId: verifiedData.uId,
        });

        const savedStudent = await newStudent.save();
        console.log("Student Saved Successfully:", savedStudent);

        res.status(200).json({
            msg: "New student added",
            newcourse: savedStudent,
        });
    } catch (err) {
        console.error("Error in /add-student:", err);
        res.status(500).json({ msg: "Something went wrong", error: err });
    }
});

// access all students of all courses
router.get('/all-student-detail/', checkAuth, (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');

        Student.find({ uId: verifiedData.uId })
            .select('_id uId fullName phone email address imageurl imageId courseId dateOfJoining')
            .then(result => {
                res.status(200).json({
                    students: result,
                });
            })
            .catch(error => {
                console.error("Error accessing students:", error);
                res.status(500).json({
                    msg: "Error occurred while accessing all student details",
                    error,
                });
            });
    } catch (error) {
        console.error("Error in /all-student-detail:", error);
        res.status(500).json({
            msg: "Something went wrong during authentication or query execution",
            error,
        });
    }
});


// access all enrolled student in particular course details
router.get('/particular-student/:id', checkAuth, (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');
        
        Student.findById(req.params.id)
            .then((result) => {
                if (!result) {
                    return res.status(404).json({
                        msg: "Student not found.",
                    });
                }
                res.status(200).json({
                    students: result,
                });
            })
            .catch((error) => {
                console.error("Error fetching student:", error);
                res.status(500).json({
                    msg: "An error occurred while fetching the student.",
                });
            });
    } catch (error) {
        console.error("Authorization or token verification error:", error);
        res.status(401).json({
            msg: "Unauthorized access. Invalid token.",
        });
    }
});

//counting number of students present in particular course
router.get('/student-count/:id', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');

        // Count students by courseId
        const studentCount = await Student.countDocuments({ uId: req.params.id });
        console.log(studentCount);
        res.status(200).json({
            data:studentCount,
        });
    } catch (err) {
        console.error("Error fetching student count:", err);
        res.status(500).json({
            msg: "An error occurred while retrieving the student count.",
            error: err.message,
        });
    }
});

router.get('/course-student-count/:id', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');

        // Count students by courseId
        const studentCount = await Student.countDocuments({ courseId: req.params.id });

        res.status(200).json({
            msg: "Student count retrieved successfully.",
            courseId: req.params.id,
            studentCount,
        });
    } catch (err) {
        console.error("Error fetching student count:", err);
        res.status(500).json({
            msg: "An error occurred while retrieving the student count.",
            error: err.message,
        });
    }
});

// delete student detail
router.delete('/delete-student/:id', checkAuth, (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');

        Student.findById(req.params.id)
            .then(student => {
                if (!student) {
                    return res.status(404).json({ msg: "Student not found." });
                }

                // Check if the authenticated user is authorized to delete this student
                if (student.uId !== verifiedData.uId) {
                    return res.status(403).json({ msg: "Unauthorized to delete this student." });
                }

                // Delete the student from the database
                Student.findByIdAndDelete(req.params.id)
                    .then(() => {
                        // Delete the associated image from Cloudinary
                        cloudinary.uploader.destroy(student.imageurl, (error, result) => {
                            if (error) {
                                console.error("Error deleting image from Cloudinary:", error);
                                return res.status(500).json({
                                    msg: "Failed to delete image from Cloudinary.",
                                    error,
                                });
                            }

                            res.status(200).json({
                                msg: "Student and image deleted successfully.",
                                cloudinaryResult: result,
                            });
                        });
                    })
                    .catch(err => {
                        console.error("Error deleting student:", err);
                        res.status(500).json({
                            msg: "Failed to delete student from the database.",
                        });
                    });
            })
            .catch(err => {
                console.error("Error finding student:", err);
                res.status(500).json({
                    msg: "Error occurred while finding the student.",
                });
            });
    } catch (err) {
        console.error("Error verifying token:", err);
        res.status(401).json({
            msg: "Invalid or missing token.",
        });
    }
});


//deleting all students of particular course
router.delete('/delete-course-student/:id', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');

        // Find all students enrolled in the course
        const students = await Student.find({ courseId: req.params.id });
        if (students.length === 0) {
            return res.status(404).json({ msg: "No students found for this course." });
        }

        // Delete students' images from Cloudinary
        const imageDeletionPromises = students.map((student) =>
            cloudinary.uploader.destroy(student.imageurl).catch((error) => {
                console.error(`Error deleting image for student ${student._id}:`, error);
                return null; // Allow other deletions to proceed
            })
        );

        // Wait for all images to be deleted
        const cloudinaryResults = await Promise.all(imageDeletionPromises);

        // Delete students from the database
        await Student.deleteMany({ courseId: req.params.id });

        res.status(200).json({
            msg: "All students and their images deleted successfully.",
            cloudinaryResults,
        });
    } catch (err) {
        console.error("Error occurred:", err);
        res.status(500).json({
            msg: "An error occurred while deleting students.",
            error: err.message,
        });
    }
});



// update student detail
router.put("/update-student/:id", checkAuth, (req, res)=>{
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project');

    Student.findById(req.params.id)
    .then(student=>{
        console.log(student);
        if(student.uId != verifiedData.uId){
            // console.log(student);
            // console.log("verification done");
            return res.status(500).json({
                msg:"you are not eligible to change"
            })
        }
       if(req.files){
        cloudinary.uploader.destroy(student.imageId,(result)=>{
        cloudinary.uploader.upload(req.files.image.tempFilePath,(err,result)=>{
            const updateStudent ={
                fullName: req.body.fullName,
                phone: req.body.phone,
                email: req.body.email,
                address: req.body.address,
                imageurl: result.secure_url,
                imageId: result.public_id,
                courseId: req.body.courseId,
                uId: verifiedData.uId,
            }
            Student.findByIdAndUpdate(req.params.id, updateStudent,{new:true})
            .then(data=>{
                res.status(200).json({
                    msg:"data updated successfully",
                    data:data
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
        const updateStudent = {
            fullName: req.body.fullName,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            imageurl: student.imageurl,
            imageId: student.imageId,
            courseId: req.body.courseId,
            uId: verifiedData.uId,
        }
        Student.findByIdAndUpdate(req.params.id, updateStudent,{new:true})
        .then(result=>{
            res.status(200).json({
                msg:"data updated successfully",
                data:result
            })
        })
        .catch(error=>{
            res.status(500).json({
                msg:"having difficulty during updating data",
                err:error
            })
        })
       }
    })
    .catch(error=>{
        res.status(500).json({
            msg:"there is problem occur while accessing by using id",
            error:error
        })
    })

})

// access of recent five enrolled students detail
router.get('/recent-students',checkAuth,(req, res)=>{
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project');
    Student.find({uId:verifiedData.uId})
    .sort({$natural:-1}).limit(5)
    .then(result=>{
        res.status(200).json({
            msg:"done access 5 recent student",
            students:result,
        })
    })
    .catch(err=>{
        res.status(500).json({
            msg:"something wrong while sorting recent 5 students",
            error:err
        })
    })
})



module.exports = router;