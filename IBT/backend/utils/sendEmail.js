import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,              
    secure: false,          
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS 
    },
    tls: {
      rejectUnauthorized: false 
    }
  });

  const mailOptions = {
    from: `"IBT Admin" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, 
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;