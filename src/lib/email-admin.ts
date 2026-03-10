import { getAdminSender, getAppUrl, transporter } from '@/lib/email-config';

export async function sendAdminPasswordEmail(
  email: string,
  firstName: string,
  collegeName: string,
  temporaryPassword: string
) {
  try {
    const loginUrl = `${getAppUrl()}/login`;
    const mailOptions = {
      from: getAdminSender(),
      to: email,
      subject: 'Your Eventura Admin Account - Login Credentials',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
              }
              .header {
                background: linear-gradient(135deg, #050607 0%, #1a1a1a 100%);
                color: #5ad7ff;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                background: white;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .credentials {
                background-color: #f0f0f0;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #5ad7ff;
              }
              .credential-item {
                margin: 12px 0;
              }
              .credential-label {
                font-weight: 600;
                color: #555;
              }
              .credential-value {
                font-family: 'Courier New', monospace;
                background: white;
                padding: 8px 12px;
                border-radius: 4px;
                margin-top: 4px;
                word-break: break-all;
              }
              .warning {
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                color: #856404;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #888;
                font-size: 12px;
              }
              .button {
                display: inline-block;
                background-color: #5ad7ff;
                color: #050607;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Welcome to Eventura</h1>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Admin Dashboard Access</p>
              </div>
              
              <div class="content">
                <p>Hi <strong>${firstName}</strong>,</p>
                
                <p>Your admin account for <strong>${collegeName}</strong> has been successfully created on Eventura. You can now access the admin dashboard to manage your college's events.</p>
                
                <div class="credentials">
                  <div class="credential-item">
                    <span class="credential-label">📧 Email:</span>
                    <div class="credential-value">${email}</div>
                  </div>
                  <div class="credential-item">
                    <span class="credential-label">🔐 Temporary Password:</span>
                    <div class="credential-value">${temporaryPassword}</div>
                  </div>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Important Security Notice:</strong>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>This is a temporary password. Change it immediately after your first login.</li>
                    <li>Keep your credentials secure and do not share them with anyone.</li>
                    <li>If you did not request this account, please contact support immediately.</li>
                  </ul>
                </div>
                
                <center>
                  <a href="${loginUrl}" class="button">Go to Admin Dashboard</a>
                </center>
                
                <p>If you have any questions or need assistance, please contact our support team.</p>
                
                <p>Best regards,<br><strong>The Eventura Team</strong></p>
              </div>
              
              <div class="footer">
                <p>© 2026 Eventura. All rights reserved.</p>
                <p>If you did not request this email, please ignore it.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to Eventura!

Your admin account for ${collegeName} has been successfully created.

Login Credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

⚠️ IMPORTANT:
- This is a temporary password. Change it immediately after your first login.
- Keep your credentials secure and do not share them with anyone.

Go to login: ${loginUrl}

Best regards,
The Eventura Team

© 2026 Eventura. All rights reserved.
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}