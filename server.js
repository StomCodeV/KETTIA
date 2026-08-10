// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());                     // Allow cross-origin requests (if needed)
app.use(express.json());             // Parse JSON bodies
app.use(express.static('.'));        // Serve static files (index.html) from current dir

// ============================================
// ⚠️ REPLACE WITH YOUR TEST SECRET KEY
// ============================================
const PAYSTACK_SECRET_KEY = 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // <-- PASTE YOUR KEY HERE

// ============================================
// Endpoint: Initialize Payment
// ============================================
app.post('/initialize-payment', async (req, res) => {
    const { email, amount } = req.body;

    // Validate
    if (!email || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid email and amount required' });
    }

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amount * 100, // convert to kobo (1 RWF = 100 kobo)
                // Optional: restrict payment channels
                // channels: ['mobile_money', 'card'],
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Send back the authorization URL and reference
        res.json({
            status: true,
            data: {
                authorization_url: response.data.data.authorization_url,
                reference: response.data.data.reference,
            },
        });
    } catch (error) {
        console.error('Paystack Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Payment initialization failed' });
    }
});

// ============================================
// Webhook Endpoint (for payment confirmation)
// ============================================
app.post('/webhook', (req, res) => {
    const event = req.body;

    // 🔐 SECURITY: Verify webhook signature in production
    // See Paystack docs for HMAC-SHA512 verification

    if (event.event === 'charge.success') {
        const transaction = event.data;
        console.log(`✅ Payment confirmed for ${transaction.customer.email}`);
        console.log(`   Reference: ${transaction.reference}`);
        console.log(`   Amount: ${transaction.amount / 100} RWF`);
        // Here you would update your database and grant access
    }

    res.sendStatus(200); // Always respond with 200 OK
});

// ============================================
// Start Server
// ============================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
});
