interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Placeholder implementation - logs to console for now
  // Replace with SendGrid when API key is available
  console.log('📧 Email would be sent:', {
    to: params.to,
    from: params.from,
    subject: params.subject,
    text: params.text?.substring(0, 100) + '...',
  });
  
  // Simulate successful send
  return true;
}

export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  const emailContent = {
    to: userEmail,
    from: 'noreply@yourcompany.com', // Replace with your verified sender email
    subject: 'Welcome to Business Intelligence Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Business Intelligence Platform!</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for registering with our Business Intelligence Platform. You now have access to:</p>
        <ul>
          <li>Competitor pricing analysis</li>
          <li>Market trend visualization</li>
          <li>Dashboard metrics and insights</li>
        </ul>
        <p>Get started by logging into your account and exploring the dashboard.</p>
        <p>Best regards,<br>The BI Platform Team</p>
      </div>
    `,
    text: `Welcome ${userName}! Thank you for registering with our Business Intelligence Platform. You now have access to competitor analysis, market trends, and dashboard insights.`
  };

  return await sendEmail(emailContent);
}

export async function sendTemporaryPasswordEmail(
  userEmail: string, 
  userName: string, 
  temporaryPassword: string
): Promise<boolean> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password`;
  
  const emailContent = {
    to: userEmail,
    from: 'noreply@yourcompany.com', // Replace with your verified sender email
    subject: 'Your Account Has Been Created - Set Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account Created Successfully</h2>
        <p>Hi ${userName},</p>
        <p>An administrator has created an account for you on the Business Intelligence Platform.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Temporary Password:</strong> <code style="background-color: #e0e0e0; padding: 2px 4px;">${temporaryPassword}</code></p>
        </div>
        <p>For security reasons, please change your password immediately after logging in.</p>
        <p><a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set New Password</a></p>
        <p>If the button doesn't work, copy and paste this link: ${resetUrl}</p>
        <p>Best regards,<br>The BI Platform Team</p>
      </div>
    `,
    text: `Hi ${userName}, an administrator has created an account for you. Email: ${userEmail}, Temporary Password: ${temporaryPassword}. Please visit ${resetUrl} to set a new password.`
  };

  return await sendEmail(emailContent);
}