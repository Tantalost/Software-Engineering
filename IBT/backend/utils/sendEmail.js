import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,               // <--- CHANGE THIS TO 2525
    secure: false,            // <--- KEEP AS FALSE
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS 
    },
    // Keep these to help bypass handshakes and debug if it fails
    connectionTimeout: 5000, 
    greetingTimeout: 5000,
    socketTimeout: 10000,
    debug: true,
    logger: true,
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

  try {
    console.log("Attempting to connect to Brevo on port 2525...");
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("DETAILED SMTP ERROR:", error);
    throw error;
  }
};

export default sendEmail;