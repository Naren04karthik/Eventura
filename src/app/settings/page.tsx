'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function SettingsPage() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [eventReminderEnabled, setEventReminderEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const passwordStrength = useMemo(() => {
    const password = passwordForm.newPassword;
    let score = 0;

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (!password) return { label: 'Not set', color: 'bg-gray-200', width: 'w-0' };
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (score === 3) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  }, [passwordForm.newPassword]);

  function closePasswordModal() {
    setShowPasswordModal(false);
    setPasswordForm(initialPasswordForm);
    setError('');
    setSuccess('');
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setError('');
    setSuccess('');
  }

  function onPasswordFormChange<K extends keyof PasswordForm>(key: K, value: PasswordForm[K]) {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSuccess('');
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || data?.message || 'Failed to change password.');
        return;
      }

      setSuccess('Password updated successfully.');
      setPasswordForm(initialPasswordForm);

      setTimeout(() => {
        closePasswordModal();
      }, 1200);
    } catch {
      setError('Network error while changing password. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || data?.message || 'Failed to delete account.');
        return;
      }

      setSuccess('Account deleted. Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch {
      setError('Network error while deleting account. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Account Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your security, preferences, and account lifecycle from one place.
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Profile and Navigation</h2>
            <p className="mt-1 text-sm text-gray-600">Quick links to your profile and saved events.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/profile"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Open Profile
              </Link>
              <Link
                href="/bookmarks"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Bookmarks
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
            <p className="mt-1 text-sm text-gray-600">Control what updates you receive.</p>

            <div className="mt-5 space-y-4">
              <PreferenceToggle
                label="In-app notifications"
                description="Receive important app activity updates."
                enabled={notificationsEnabled}
                onToggle={() => setNotificationsEnabled((prev) => !prev)}
              />
              <PreferenceToggle
                label="Event reminders"
                description="Get reminders before your registered events start."
                enabled={eventReminderEnabled}
                onToggle={() => setEventReminderEnabled((prev) => !prev)}
              />
              <PreferenceToggle
                label="Product announcements"
                description="Occasional product updates and new feature announcements."
                enabled={marketingEnabled}
                onToggle={() => setMarketingEnabled((prev) => !prev)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            <p className="mt-1 text-sm text-gray-600">Update your password and protect your account.</p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  setError('');
                  setSuccess('');
                }}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Change Password
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
            <p className="mt-1 text-sm text-red-700/80">
              Delete your account permanently. This action cannot be undone.
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setError('');
                  setSuccess('');
                }}
                className="rounded-lg border border-red-400 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Delete Account
              </button>
            </div>
          </section>
        </div>
      </main>

      {showPasswordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900">Change Password</h3>
            <p className="mt-1 text-sm text-gray-600">Use a strong and unique password.</p>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <Field
                label="Current password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(value) => onPasswordFormChange('currentPassword', value)}
              />

              <Field
                label="New password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(value) => onPasswordFormChange('newPassword', value)}
              />

              <Field
                label="Confirm new password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(value) => onPasswordFormChange('confirmPassword', value)}
              />

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                  <span>Password strength</span>
                  <span>{passwordStrength.label}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className={`h-full transition-all ${passwordStrength.color} ${passwordStrength.width}`} />
                </div>
              </div>

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              ) : null}

              {success ? (
                <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
              ) : null}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-red-700">Delete Account</h3>
            <p className="mt-2 text-sm text-gray-700">
              This permanently deletes your profile data and cannot be reversed.
            </p>

            {error ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}

            {success ? (
              <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={actionLoading}
                className="flex-1 rounded-lg border border-red-500 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type FieldProps = {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
};

function Field({ label, type, value, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

type PreferenceToggleProps = {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
};

function PreferenceToggle({ label, description, enabled, onToggle }: PreferenceToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-600">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={`relative h-6 w-11 rounded-full transition ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? 'left-5' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
}
