import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

console.log("User:", process.env.EMAIL_USER);
console.log("Pass (first 4 chars):", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 4) : "MISSING");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER, // Send to yourself
  subject: 'Nodemailer Test',
  text: 'If you see this, email is working!',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});