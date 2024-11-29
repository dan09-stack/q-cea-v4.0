import * as functions from "firebase-functions";
import nodemailer from "nodemailer";
import {Request, Response} from "express";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com", // Replace with your email
    pass: "your-app-password", // Replace with your app password
  },
});

// Function to generate a 6-digit verification code
const generateCode = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Cloud function to send a verification email
export const sendVerificationEmail = functions.https.onRequest(
  async (req: Request, res: Response): Promise<void> => {
    const {email} = req.body;

    // Validate the email field
    if (!email) {
      res.status(400).json({error: "Email is required"});
      return;
    }

    const verificationCode = generateCode();

    const mailOptions = {
      from: "your-email@gmail.com", // Replace with your email
      to: email,
      subject: "Verification Code",
      text: `Your verification code is: ${verificationCode}`,
      html: `<p>Your verification code is: <strong>
      ${verificationCode}</strong></p>`,
    };

    try {
      // Send email
      await transporter.sendMail(mailOptions);
      res.status(200).json({
        message: "Verification code sent successfully",
        code: verificationCode, 
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({error: "Failed to send email"});
    }
  }
);
