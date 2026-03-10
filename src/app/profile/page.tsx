'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileCompletionCard from '@/components/profile/ProfileCompletionCard';

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

const GENDERS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
    gender: '',
    dateOfBirth: '',
    year: '',
    branch: '',
    customBranch: '',
    city: '',
    state: '',
    country: '',
  });

  const [completionStatus, setCompletionStatus] = useState({
    isComplete: false,
    completionPercentage: 0,
    missingFields: [],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfile(data.profile);
        
        // Populate form with existing data
        setFormData({
          firstName: data.user?.firstName || '',
          lastName: data.user?.lastName || '',
          email: data.user?.email || '',
          whatsapp: data.profile?.whatsapp || '',
          gender: data.profile?.gender || '',
          dateOfBirth: data.profile?.dateOfBirth || '',
          year: data.profile?.year?.toString() || '',
          branch: data.profile?.branch || '',
          customBranch: data.profile?.customBranch || '',
          city: data.profile?.city || '',
          state: data.profile?.state || '',
          country: data.profile?.country || '',
        });

        // Fetch completion status
        if (data.user?.id) {
          fetchCompletionStatus(data.user.id);
        }
      } else {
        setErrorMessage('Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setErrorMessage('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletionStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/profile/completion?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCompletionStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch completion status:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage('');
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setErrorMessage('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setErrorMessage('Last name is required');
      return false;
    }
    if (formData.year && (parseInt(formData.year) < 1 || parseInt(formData.year) > 5)) {
      setErrorMessage('Year must be between 1 and 5');
      return false;
    }
    if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
      setErrorMessage('Date of birth cannot be in the future');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        whatsapp: formData.whatsapp || null,
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        year: formData.year ? parseInt(formData.year) : null,
        branch: formData.branch || null,
        customBranch: formData.customBranch || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
      };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMessage('Profile updated successfully!');
        setEditing(false);
        await fetchProfile();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrorMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600 text-sm mt-1">{user?.email}</p>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className={`mt-4 sm:mt-0 px-6 py-2 rounded-lg font-medium transition-colors ${
                  editing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <ProfileCompletionCard
              status={{
                isComplete: completionStatus.isComplete,
                completionPercentage: completionStatus.completionPercentage,
                missingFields: completionStatus.missingFields,
              }}
            />
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <span className="text-lg">✓</span>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <span className="text-lg">✕</span>
            {errorMessage}
          </div>
        )}

        {/* Profile Content */}
        {editing ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Personal Details Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            {/* Academic Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white cursor-pointer"
                  >
                    <option value="">Select Year</option>
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white cursor-pointer"
                  >
                    <option value="">Select Branch</option>
                    {BRANCHES.map((branch) => (
                      <option key={branch.value} value={branch.value}>
                        {branch.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* View Mode */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-medium">First Name</p>
                  <p className="text-lg text-gray-900 mt-1">{user?.firstName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Last Name</p>
                  <p className="text-lg text-gray-900 mt-1">{user?.lastName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Email</p>
                  <p className="text-lg text-gray-900 mt-1">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">WhatsApp</p>
                  <p className="text-lg text-gray-900 mt-1">{profile?.whatsapp || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Gender</p>
                  <p className="text-lg text-gray-900 mt-1">{profile?.gender || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Date of Birth</p>
                  <p className="text-lg text-gray-900 mt-1">
                    {profile?.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Year</p>
                  <p className="text-lg text-gray-900 mt-1">{profile?.year ? `Year ${profile.year}` : 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Branch</p>
                  <p className="text-lg text-gray-900 mt-1">
                    {profile?.branch
                      ? BRANCHES.find((b) => b.value === profile.branch)?.label || profile.branch
                      : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-medium">City</p>
                  <p className="text-lg text-gray-900 mt-1">{profile?.city || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">State</p>
                  <p className="text-lg text-gray-900 mt-1">{profile?.state || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Country</p>
                  <p className="text-lg text-gray-900 mt-1">{profile?.country || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-3">
              <Link href="/bookmarks" className="flex-1 px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-center">
                View Bookmarks
              </Link>
              <Link href="/settings" className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center">
                Account Settings
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
