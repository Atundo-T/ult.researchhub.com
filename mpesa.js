const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const consumerKey = 'YOUR_CONSUMER_KEY';
const consumerSecret = 'YOUR_CONSUMER_SECRET';
const shortcode = '174379'; // Lipa Na M-Pesa Paybill
const passkey = 'YOUR_LIPA_NA_MPESA_PASSKEY';
const callbackUrl = 'https://yourdomain.com/callback'; // Must be publicly accessible
const baseUrl = 'https://sandbox.safaricom.co.ke'; // change to live for production

// 1. Get Access Token
async function getAccessToken() {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` }
    });
    return response.data.access_token;
}

// 2. STK Push Endpoint
app.post('/stkpush', async (req, res) => {
    const { phone, amount, reference } = req.body;

    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const payload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: reference,
        TransactionDesc: 'Payment for business document'
    };

    try {
        const stkRes = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        res.json({ success: true, data: stkRes.data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'STK Push failed', error: err.response.data });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
