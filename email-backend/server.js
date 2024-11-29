const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Import CORS to handle cross-origin requests
const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Middleware to parse JSON requests

// Set up the transporter using your Gmail account
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'your-email@gmail.com',  // Your Gmail email address
    pass: 'your-email-password',   // Your Gmail password or App Password (recommended)
  },
});

// Function to generate a random 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Function to send a verification email
const sendVerificationEmail = (email, code) => {
  const mailOptions = {
    from: 'your-email@gmail.com', 
    to: email,
    subject: 'Verification Code',
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  };

  return transporter.sendMail(mailOptions);
};

// Endpoint to handle sending the verification email
app.post('/send-verification', async (req, res) => {
  const { email } = req.body;
  
  // Validate the email format
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const verificationCode = generateCode();

  try {
    await sendVerificationEmail(email, verificationCode);
    res.status(200).json({ message: 'Verification code sent to email', code: verificationCode });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
