export { sendAdminPasswordEmail } from '@/lib/email-admin';
export {
  sendApprovalGrantedEmail,
  sendApprovalRequestEmail,
  sendEventRegistrationSuccessEmail,
  type ApprovalGrantedEmailParams,
  type ApprovalRequestEmailParams,
} from '@/lib/email-approval';
export { getSuperadminEmail, transporter } from '@/lib/email-config';

import { transporter } from '@/lib/email-config';

export async function verifyEmailConfiguration() {
  try {
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
