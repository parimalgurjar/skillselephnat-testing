const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Skillselephant" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Skillselephant - Password Reset OTP",
    text: `Your password reset OTP is ${otp}. It is valid for 10 minutes. Do not share this OTP with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:25px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#011451;">Password Reset</h2>
        <p>Your Skillselephant password reset OTP is:</p>
        <h1 style="letter-spacing:8px;color:#f6af1d;">${otp}</h1>
        <p>This OTP is valid for <b>10 minutes</b>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr />
        <p style="color:#777;font-size:12px;">Skillselephant Team</p>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail };