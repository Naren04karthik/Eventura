'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/auth-context';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setActionLoading(true);

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to home page
        window.location.href = '/';
      } else {
        setError(data.message || 'Failed to delete account');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      <Navbar user={user} />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-normal mb-2">Settings</h1>
          <p className="text-muted">Manage your account security</p>
        </div>

        <div className="space-y-6">
          {/* Change Password */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <p className="text-sm text-muted mb-4">Update your account password to keep it secure.</p>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-6 py-2.5 bg-neon text-black rounded-lg font-medium hover:bg-neon/90 transition"
            >
              Change Password
            </button>
          </div>

          {/* Delete Account */}
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Delete Account</h2>
            <p className="text-sm text-muted mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium hover:bg-red-500/30 transition"
            >
              Delete Account
            </button>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setError('');
                    setSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-neon text-black rounded-lg font-medium hover:bg-neon/90 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-red-500/30 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-red-400">Delete Account?</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <p className="text-muted mb-6">
              Are you sure you want to delete your account? This action is permanent and cannot be undone. 
              All your data, events, and registrations will be permanently deleted.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setError('');
                }}
                className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium hover:bg-red-500/30 transition disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
