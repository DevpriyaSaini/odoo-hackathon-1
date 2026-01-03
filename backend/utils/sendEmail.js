const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send email utility
const sendEmail = async (options) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `Dayflow HRMS <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email error: ', error.message);
        // Don't throw error, just log it (for development without email setup)
        return { success: false, error: error.message };
    }
};

// Email Templates
const emailTemplates = {
    // Email Verification Template
    verification: (name, verificationUrl) => ({
        subject: 'Verify Your Email - Dayflow HRMS',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Dayflow HRMS</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Welcome, ${name}! 👋</h2>
          <p style="color: #666; font-size: 16px;">Thank you for registering with Dayflow HRMS. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #999; font-size: 14px;">This link will expire in 24 hours.</p>
          <p style="color: #999; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `
    }),

    // Leave Request Notification (to HR)
    leaveRequestNotification: (employeeName, leaveType, startDate, endDate, remarks) => ({
        subject: `New Leave Request from ${employeeName} - Dayflow HRMS`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Dayflow HRMS</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">New Leave Request 📋</h2>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Employee:</strong> ${employeeName}</p>
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>From:</strong> ${startDate}</p>
            <p><strong>To:</strong> ${endDate}</p>
            <p><strong>Remarks:</strong> ${remarks || 'N/A'}</p>
            <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending</span></p>
          </div>
          <p style="color: #666;">Please review this request in the Dayflow HRMS dashboard.</p>
        </div>
      </div>
    `
    }),

    // Leave Decision Notification (to Employee)
    leaveDecisionNotification: (employeeName, leaveType, startDate, endDate, status, remarks) => ({
        subject: `Leave Request ${status} - Dayflow HRMS`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Dayflow HRMS</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Leave Request Update 📢</h2>
          <p style="color: #666;">Hello ${employeeName},</p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>From:</strong> ${startDate}</p>
            <p><strong>To:</strong> ${endDate}</p>
            <p><strong>Status:</strong> <span style="color: ${status === 'Approved' ? '#10b981' : '#ef4444'}; font-weight: bold;">${status}</span></p>
            ${remarks ? `<p><strong>HR Remarks:</strong> ${remarks}</p>` : ''}
          </div>
        </div>
      </div>
    `
    }),

    // Password Reset Template
    passwordReset: (name, resetUrl) => ({
        subject: 'Password Reset Request - Dayflow HRMS',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Dayflow HRMS</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Password Reset Request 🔐</h2>
          <p style="color: #666;">Hello ${name},</p>
          <p style="color: #666;">You requested a password reset. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #999; font-size: 14px;">This link will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `
    })
};

module.exports = { sendEmail, emailTemplates };
