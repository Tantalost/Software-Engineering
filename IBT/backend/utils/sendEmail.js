import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1. Create the Transporter
  // For Gmail, use "service: 'Gmail'". For others (Hostinger, GoDaddy), use host/port.
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or use host: 'smtp.example.com', port: 587,
    auth: {
      user: process.env.EMAIL_USER, // Put your email in .env
      pass: process.env.EMAIL_PASS  // Put your app password in .env
    }
  });

  // 2. Define Email Options
  const mailOptions = {
    from: `"IBT Admin" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // Plain text body
    // html: options.html // You can add HTML here if you want pretty emails
  };

  // 3. Send Email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;