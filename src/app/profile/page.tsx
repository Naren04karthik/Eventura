'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { AppUser, ProfileInfo } from '@/types';
import ProfileAvatarFallback from '@/components/profile/ProfileAvatarFallback';

const BRANCHES = [
  { value: 'CSE', label: 'Computer Science Engineering' },
  { value: 'ECE', label: 'Electronics & Communication Engineering' },
  { value: 'EEE', label: 'Electrical & Electronics Engineering' },
  { value: 'MECH', label: 'Mechanical Engineering' },
  { value: 'CIVIL', label: 'Civil Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'AIDS', label: 'Artificial Intelligence & Data Science' },
  { value: 'AIML', label: 'Artificial Intelligence & Machine Learning' },
  { value: 'BBA', label: 'Bachelor of Business Administration' },
  { value: 'BCA', label: 'Bachelor of Computer Applications' },
  { value: 'MBA', label: 'Master of Business Administration' },
  { value: 'MCA', label: 'Master of Computer Applications' },
  { value: 'OTHER', label: 'Other' },
];

const YEARS = [1, 2, 3, 4, 5];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    collegeId: '',
    whatsapp: '',
    gender: '',
    dateOfBirth: '',
    college: '',
    year: 1,
    branch: '',
    customBranch: '',
    city: '',
    state: '',
    country: '',
    profilePhoto: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [message, setMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchUser();
    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (message) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [message]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/profile/complete');
      if (response.ok) {
        const data = await response.json();
        const currentUser = {
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          status: data.status,
          collegeId: data.profile?.collegeId || data.collegeId,
        } as AppUser;

        if (currentUser.role === 'ADMIN') {
          router.replace('/admin/dashboard');
          return;
        }

        if (currentUser.role === 'SUPERADMIN') {
          router.replace('/superadmin/dashboard');
          return;
        }

        setUser(currentUser);
        setProfile(data.profile || null);
        setImagePreview(data.profile?.profilePhoto || '');
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          collegeId: data.profile?.collegeId || data.collegeId || '',
          whatsapp: data.profile?.whatsapp || '',
          gender: data.profile?.gender || '',
          dateOfBirth: data.profile?.dateOfBirth ? new Date(data.profile.dateOfBirth).toISOString().split('T')[0] : '',
          college: data.profile?.college || '',
          year: data.profile?.year || 1,
          branch: data.profile?.branch || '',
          customBranch: data.profile?.customBranch || '',
          city: data.profile?.city || '',
          state: data.profile?.state || '',
          country: data.profile?.country || '',
          profilePhoto: data.profile?.profilePhoto || '',
        });
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData((prev) => ({
          ...prev,
          profilePhoto: base64,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setMessage('');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => console.error('Play error:', err));
          };
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraOpen(false);
      if (err.name === 'NotAllowedError') {
        setMessage('Camera access denied. Please grant camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setMessage('No camera found on this device.');
      } else {
        setMessage('Failed to access camera.');
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      const base64 = canvasRef.current.toDataURL('image/jpeg', 0.9);
      setImagePreview(base64);
      setFormData((prev) => ({ ...prev, profilePhoto: base64 }));
      stopCamera();
      setMessage('');
    } catch (err) {
      console.error('Error capturing photo:', err);
      setMessage('Failed to capture photo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => null);

      if (response.ok) {
        setMessage('Profile updated successfully!');
        setEditing(false);
        fetchUser();
      } else {
        setMessage(data?.error || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('Something went wrong');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setSecurityError('Password must be at least 8 characters long');
      return;
    }

    setSecurityLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setSecuritySuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setSecurityError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setSecurityError('An error occurred. Please try again.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSecurityError('');
    setSecurityLoading(true);
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        window.location.href = '/';
      } else {
        setSecurityError(data.message || 'Failed to delete account');
      }
    } catch (error) {
      setSecurityError('An error occurred. Please try again.');
    } finally {
      setSecurityLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white flex flex-col">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-neon/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <Navbar user={user} />

      <main className="relative z-10 flex-1 mx-auto max-w-6xl px-6 py-12 w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-normal mb-2">My Profile</h1>
            <p className="text-muted">Manage your account and profile details</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-2xl border border-white/20 bg-gradient-to-r from-white/10 to-white/5 px-5 py-2.5 text-sm text-white font-medium transition hover:bg-white/15 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.414 2.586a2 2 0 112.828 2.828L12 14.657l-4 1 1-4 9.414-9.414z" />
                </svg>
                Edit Profile
              </span>
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm ${
              message.includes('success')
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message}
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-black/75 p-8 backdrop-blur-md">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-4 pb-6 border-b border-white/10">
                <div className="relative h-40 w-40 overflow-hidden rounded-3xl border border-white/20">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/10">
                      <ProfileAvatarFallback className="h-20 w-20" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Photo
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={cameraLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {cameraLoading ? 'Opening...' : 'Take Photo'}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <canvas ref={canvasRef} className="hidden" />
                <p className="text-xs text-muted text-center mt-2">JPG, PNG or GIF (max 2MB)</p>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-soft">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Roll Number</label>
                    <input
                      type="text"
                      name="collegeId"
                      value={formData.collegeId}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                      placeholder="Your college ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-4 pt-6 border-t border-white/10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-soft">Academic Information</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">College Name</label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                    placeholder="Your college name"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Branch</label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                    >
                      <option value="">Select Branch</option>
                      {BRANCHES.map((branch) => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Year</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                    >
                      {YEARS.map((year) => (
                        <option key={year} value={year}>
                          Year {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {formData.branch === 'OTHER' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Specify Branch</label>
                    <input
                      type="text"
                      name="customBranch"
                      value={formData.customBranch}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                      placeholder="Enter your branch"
                    />
                  </div>
                )}
              </div>

              {/* Location Info */}
              <div className="space-y-4 pt-6 border-t border-white/10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-soft">Location</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:outline-none focus:border-neon transition"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 rounded-xl border border-white/20 bg-black py-3 text-white font-semibold transition hover:bg-white/5"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setMessage('');
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-black py-3 text-white font-medium hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
              <div className="rounded-3xl border border-white/10 bg-black/80 p-6 md:p-8 lg:sticky lg:top-28 h-fit">
                <div className="flex flex-col items-center text-center">
                  <div className="relative h-44 w-44 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 md:h-52 md:w-52">
                    {profile?.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10">
                        <ProfileAvatarFallback className="h-24 w-24" />
                      </div>
                    )}
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold text-white">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="mt-2 text-sm text-soft break-all">{user.email}</p>
                  {profile?.college && (
                    <p className="mt-3 text-sm text-white/90">{profile.college}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-muted uppercase tracking-wider">
                      {user.role}
                    </span>
                    {user.collegeId && (
                      <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-muted uppercase tracking-wider">
                        Roll: {user.collegeId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-black/70 p-6">
                  <h3 className="text-lg font-semibold text-white">Personal Details</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-muted">WhatsApp</p>
                      <p className="mt-1 text-base text-white">{profile?.whatsapp || '—'}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-muted">Gender</p>
                      <p className="mt-1 text-base text-white">{profile?.gender || '—'}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4 md:col-span-2">
                      <p className="text-xs text-muted">Date of Birth</p>
                      <p className="mt-1 text-base text-white">
                        {profile?.dateOfBirth
                          ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }).replace(/ /g, '-')
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/70 p-6">
                  <h3 className="text-lg font-semibold text-white">Academic & Location</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-muted">College</p>
                      <p className="mt-1 text-base text-white">{profile?.college || '—'}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-muted">Branch</p>
                      <p className="mt-1 text-base text-white">
                        {profile?.branch === 'OTHER'
                          ? profile?.customBranch || '—'
                          : BRANCHES.find((b) => b.value === profile?.branch)?.label || profile?.branch || '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-muted">Year</p>
                      <p className="mt-1 text-base text-white">{profile?.year ? `Year ${profile.year}` : '—'}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-muted">City</p>
                      <p className="mt-1 text-base text-white">{profile?.city || '—'}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-muted">State</p>
                      <p className="mt-1 text-base text-white">{profile?.state || '—'}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="text-xs text-muted">Country</p>
                      <p className="mt-1 text-base text-white">{profile?.country || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/70 p-6">
                  <h3 className="text-lg font-semibold text-white">Security</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(true);
                        setSecurityError('');
                        setSecuritySuccess('');
                      }}
                      className="rounded-xl border border-white/15 bg-black/40 p-4 text-left transition hover:border-neon/60 hover:bg-white/5"
                    >
                      <p className="text-sm font-semibold text-white">Change Password</p>
                      <p className="mt-1 text-xs text-muted">Update your account password</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(true);
                        setSecurityError('');
                      }}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-left transition hover:bg-red-500/20"
                    >
                      <p className="text-sm font-semibold text-red-300">Delete Account</p>
                      <p className="mt-1 text-xs text-red-200/80">Permanently remove your account</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black p-6">
            <h2 className="text-2xl font-semibold mb-4">Change Password</h2>

            {securityError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {securityError}
              </div>
            )}
            {securitySuccess && (
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                {securitySuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-neon focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-neon focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-neon focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSecurityError('');
                    setSecuritySuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-white transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="flex-1 rounded-lg bg-neon px-4 py-2.5 font-medium text-black transition hover:bg-neon/90 disabled:opacity-50"
                >
                  {securityLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-black p-6">
            <h2 className="text-2xl font-semibold mb-4 text-red-400">Delete Account?</h2>

            {securityError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {securityError}
              </div>
            )}

            <p className="mb-6 text-sm text-muted">
              This action is permanent and cannot be undone. All your data will be deleted.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSecurityError('');
                }}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-white transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={securityLoading}
                className="flex-1 rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2.5 font-medium text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
              >
                {securityLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isMounted && cameraOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4">
            <button
              type="button"
              onClick={stopCamera}
              className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-video bg-black"
              />
              <div className="p-6 flex justify-center">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex items-center gap-2 rounded-full bg-neon px-6 py-3 font-semibold text-black transition hover:bg-neon/80"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                  Capture
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
