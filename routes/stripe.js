const express = require('express');
const router = express.Router();


router.post("/create-payment-intent", async (req, res) => {
    try {
        const { amount, currency } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: currency || "usd",
        });

        res.json({ clientSecret: process.env.STRIPE_SECRET_KEY });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;