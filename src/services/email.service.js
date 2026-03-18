require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});
// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your Name" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail,username){
    const subject = 'Welcome to Our E-commerce Platform!';
    const text = `Hi ${username},\n\nThank you for registering on our e-commerce platform! We're excited to have you on board.\n\nBest regards,\nThe E-commerce Team`;
    const html = `<p>Hi ${username},</p><p>Thank you for registering on our e-commerce platform! We're excited to have you on board.</p><p>Best regards,<br>The E-commerce Team</p>`;
    await sendEmail(userEmail,subject,text,html)
}

async function sendLoginEmail(userEmail,username){
    const subject = 'Login Alert for Your E-commerce Account';
    const text = `Hi ${username},\n\nWe noticed a login to your account. If this was you, you can safely ignore this email. If you did not log in, please secure your account immediately.\n\nBest regards,\nThe E-commerce Team`;
    const html = `<p>Hi ${username},</p><p>We noticed a login to your account. If this was you, you can safely ignore this email. If you did not log in, please secure your account immediately.</p><p>Best regards,<br>The E-commerce Team</p>`;
    await sendEmail(userEmail,subject,text,html)
}

async function sendTransactionEmail(userEmail,name,amount,toAccount){
    const subject = 'Transaction Alert for Your E-commerce Account';
    const text = `Hi ${name},\n\nA transaction of $${amount} has been made to account ${toAccount}. If this was you, you can safely ignore this email. If you did not authorize this transaction, please contact our support immediately.\n\nBest regards,\nThe E-commerce Team`;
    const html = `<p>Hi ${name},</p><p>A transaction of $${amount} has been made to account ${toAccount}. If this was you, you can safely ignore this email. If you did not authorize this transaction, please contact our support immediately.</p><p>Best regards,<br>The E-commerce Team</p>`;
    await sendEmail(userEmail,subject,text,html)
}



module.exports = {sendRegistrationEmail,sendEmail,transporter,sendLoginEmail,sendTransactionEmail}
