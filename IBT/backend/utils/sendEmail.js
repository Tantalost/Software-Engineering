import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,
    secure: false, // TLS is handled via STARTTLS on port 2525
    auth: {
      user: process.env.EMAIL_USER, // Your Brevo SMTP ID (a25ead001...)
      pass: process.env.EMAIL_PASS  // Your Brevo SMTP Key
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    // This combines the name and the verified email correctly
    from: `"${process.env.FROM_NAME || 'IBT Admin'}" <${process.env.SENDER_EMAIL}>`, 
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">IBT Security Code</h2>
        <p>Hello,</p>
        <p style="font-size: 16px;">${options.message}</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
          If you did not request this, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully! MessageID:", info.messageId);
    return info;
  } catch (error) {
    // Detailed logging to catch any future sender rejections
    console.error("Critical Mail Error:", error.message);
    if (error.response) console.error("SMTP Response:", error.response);
    throw new Error("Could not send verification email.");
  }
};

export default sendEmail;