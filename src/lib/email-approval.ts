import { getAppUrl, getAdminSender, getSuperadminEmail, transporter } from '@/lib/email-config';

export type ApprovalRequestEmailParams = {
  type: 'ADMIN' | 'ORGANIZER';
  requesterName: string;
  requesterEmail: string;
  collegeName?: string;
  organizationName?: string;
  reason?: string;
};

export type ApprovalGrantedEmailParams = {
  type: 'ADMIN' | 'ORGANIZER';
  recipientEmail: string;
  recipientName: string;
  collegeName?: string;
  organizationName?: string;
};

export async function sendApprovalRequestEmail(params: ApprovalRequestEmailParams) {
  const reviewUrl = `${getAppUrl()}/superadmin/dashboard`;
  const subject =
    params.type === 'ADMIN'
      ? 'Eventura: New admin access request'
      : 'Eventura: New organizer approval request';
  const approvalMessage =
    params.type === 'ADMIN'
      ? `You have an admin approval request from ${params.requesterName} with email ${params.requesterEmail} for ${params.collegeName || 'N/A'}. Approve this by visiting the website ${reviewUrl}.`
      : `You have an organizer approval request from ${params.requesterName} with email ${params.requesterEmail} for ${params.organizationName || 'N/A'}. Approve this by visiting the website ${reviewUrl}.`;
  const reasonLine = params.type === 'ORGANIZER' && params.reason ? `\nReason: ${params.reason}` : '';

  try {
    await transporter.sendMail({
      from: getAdminSender(),
      to: getSuperadminEmail(),
      subject,
      text: `${approvalMessage}${reasonLine}`,
    });
  } catch (error) {
    console.error('Error sending approval request email:', error);
  }
}

export async function sendApprovalGrantedEmail(params: ApprovalGrantedEmailParams) {
  const loginUrl = `${getAppUrl()}/login`;
  const subject =
    params.type === 'ADMIN'
      ? 'Eventura: Your admin access is approved'
      : 'Eventura: Your organizer access is approved';
  const title = params.type === 'ADMIN' ? 'Admin Access Approved' : 'Organizer Access Approved';
  const contextLine = params.type === 'ADMIN'
    ? `Your admin access for ${params.collegeName || 'your college'} is now active.`
    : `Your organizer access for ${params.organizationName || 'your college'} is now active.`;

  try {
    await transporter.sendMail({
      from: getAdminSender(),
      to: params.recipientEmail,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #222;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 24px;
                background-color: #f8f9fb;
              }
              .header {
                background: #050607;
                color: #5ad7ff;
                padding: 24px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #ffffff;
                padding: 24px;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                background-color: #5ad7ff;
                color: #050607;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
              }
              .footer {
                text-align: center;
                margin-top: 24px;
                color: #777;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 22px;">${title}</h1>
                <p style="margin: 8px 0 0; font-size: 13px;">You can now sign in</p>
              </div>
              <div class="content">
                <p>Hi <strong>${params.recipientName}</strong>,</p>
                <p>${contextLine}</p>
                <p>Visit Eventura to sign in with your account.</p>
                <p>
                  <a class="button" href="${loginUrl}">Sign in to Eventura</a>
                </p>
                <p>Best regards,<br><strong>Eventura</strong></p>
              </div>
              <div class="footer">
                <p>Eventura Notifications</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${title}

Hi ${params.recipientName},

${contextLine}

Visit Eventura to sign in with your account: ${loginUrl}

Eventura Notifications
      `,
    });
  } catch (error) {
    console.error('Error sending approval granted email:', error);
  }
}

export async function sendEventRegistrationSuccessEmail(
  recipientEmail: string,
  eventTitle: string
) {
  try {
    await transporter.sendMail({
      from: getAdminSender(),
      to: recipientEmail,
      subject: 'Eventura: Event registration successful',
      text: `You have registered to ${eventTitle} event.`,
    });
  } catch (error) {
    console.error('Error sending registration success email:', error);
  }
}