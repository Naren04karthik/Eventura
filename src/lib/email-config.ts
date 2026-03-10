import nodemailer from 'nodemailer';

const DEFAULT_SUPERADMIN_EMAIL = 'myprojecthub27@gmail.com';
const DEFAULT_APP_URL = 'https://eventura.example.com';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export function getSuperadminEmail() {
  return process.env.SUPERADMIN_EMAIL || DEFAULT_SUPERADMIN_EMAIL;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
}

export function getAdminSender() {
  return `"Eventura Admin" <${process.env.EMAIL_USER}>`;
}