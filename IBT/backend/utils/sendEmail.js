import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS 
    },
    // --- DEBUGGING & SPEED FIXES ---
    debug: true,              // Log the SMTP traffic to your Render console
    logger: true,             // Include detailed logs in the output
    connectionTimeout: 10000, // Stop trying after 10 seconds (don't wait 2 minutes)
    greetingTimeout: 5000,    // Stop if Gmail doesn't say "Hello" in 5 seconds
    socketTimeout: 10000,     // Stop if data transfer hangs for 10 seconds
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'   // Ensure modern encryption is used
    }
  });

  const mailOptions = {
    from: `"IBT Admin" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, 
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    // This will now print the EXACT SMTP error code in Render logs
    console.error("DETAILED SMTP ERROR:", error);
    throw error;
  }
};

export default sendEmail;