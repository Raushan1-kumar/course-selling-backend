const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/checkAuth');
const Course = require('../models/Course');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Fee = require('../models/Fee');

require('dotenv').config();


router.post('/add-fee', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project');

    Fee.find({ phone: req.body.phone })
        .then(phone => {
            if (phone.length > 0) {
                return res.status(500).json({
                    msg: "This phone has already been used"
                })
            }
            else {
                const newFee = new Fee({
                    _id: new mongoose.Types.ObjectId,
                    fullName: req.body.fullName,
                    phone: req.body.phone,
                    courseId: req.body.courseId,
                    uId: verifiedData.uId,
                    amount: req.body.amount,
                    remark: req.body.remark,
                })
                newFee.save().then(result => {
                    res.status(200).json({
                        msg: "new fee added",
                        newFeeDetail: result
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

})


//get all payment-history
router.get('/payment-history', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project');

    Fee.find({ uId: verifiedData.uId })
        .then(paymentHistory => {
            res.status(200).json({
                studentfee: paymentHistory
            })
        })
        .catch(err => {
            res.status(500).json({
                msg: "having trouble while accessing all student payment history",
                error: err
            })
        })
})

// accessing amount of a student who paid a particular course

router.get('/access-student-amount', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const verifiedData = jwt.verify(token, 'my first project')

    Fee.find({ uId: verifiedData.uId, courseId: req.query.courseId, phone: req.query.phone })
        .then(student => {
            res.status(200).json({
                student: student,
                amount: student.amount
            })
        })
        .catch(err => {
            res.status(500).json({
                msg: "having trouble while finding",
                error: err
            })
        })
})

//accessing particular student all payment
router.get('/student-payment/:phone', checkAuth, async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    try {
        const verifiedData = jwt.verify(token, 'my first project');

        // Find fees associated with the student's phone number
        const feeRecords = await Fee.find({ phone: req.params.phone });

        if (!feeRecords.length) {
            return res.status(404).json({ message: 'No fee records found for this student.' });
        }
        // Extract all course IDs from the fee records
        const courseIds = feeRecords.map((record) => record.courseId);
        // Find all courses associated with those IDs
        const courses = await Course.find({ courseId: { $in: courseIds } });
        // Map fee records to include course details
        const feeDetailsWithCourses = feeRecords.map((fee) => {
            const course = courses.find((c) => c.courseId === fee.courseId);
            return {
                ...fee._doc, // Include all fee record fields
                courseName: course ? course.name : 'Course not found',
            };
        });

        // Send the response
        res.status(200).json({
            feeDetail: feeDetailsWithCourses,
        });
    } catch (err) {
        console.error('Error fetching student payment details:', err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
});

router.get('/total-amount', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifiedData = jwt.verify(token, 'my first project');

        const totalAmount = await Fee.aggregate([
            { $match: { uId: verifiedData.uId } }, // Match records belonging to the current user
            { $group: { _id: null, total: { $sum: "$amount" } } }, // Sum the `amount` field
        ]);

        res.status(200).json({
            totalAmount: totalAmount[0]?.total || 0, // Handle cases where no fees exist
        });
    } catch (err) {
        console.error("Error calculating total amount:", err);
        res.status(500).json({ msg: "Something went wrong", error: err.message });
    }
});

module.exports = router;