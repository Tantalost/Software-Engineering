import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS  
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const isOTP = options.subject.toLowerCase().includes('code') || 
                options.subject.toLowerCase().includes('otp') || 
                options.subject.toLowerCase().includes('verification');

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'IBT Admin'}" <${process.env.SENDER_EMAIL}>`, 
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">
          ${isOTP ? 'IBT Security Code' : options.subject}
        </h2>
        
        ${isOTP ? '<p>Hello,</p>' : ''}
        
        <p style="font-size: 16px; white-space: pre-wrap;">${options.message}</p>
        
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
          ${isOTP 
            ? 'If you did not request this, please ignore this email.' 
            : 'This is an automated message regarding your stall application. Please do not reply directly to this email.'}
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully! MessageID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Critical Mail Error:", error.message);
    if (error.response) console.error("SMTP Response:", error.response);
    throw new Error("Could not send verification email.");
  }
};

export default sendEmail;