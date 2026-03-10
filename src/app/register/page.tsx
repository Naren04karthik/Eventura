'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicAuthLayout from '@/components/auth/PublicAuthLayout';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    collegeId: '',
    collegeName: '',
    collegeChoice: '',
    organizationChoice: '',
    organizationName: '',
    contactNumber: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<{ id: string; name: string }[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const roleLinkClass = (role: 'USER' | 'ORGANIZER') =>
    formData.role === role ? 'text-white' : 'text-muted hover:text-white';

  const handleRoleSelect = (role: 'USER' | 'ORGANIZER') => {
    setError('');
    setFormData((prev) => {
      if (role === 'ORGANIZER') {
        return {
          ...prev,
          role,
          collegeId: '',
          collegeChoice: '',
          collegeName: '',
        };
      }

      return {
        ...prev,
        role,
        organizationChoice: '',
        organizationName: '',
        contactNumber: '',
        reason: '',
      };
    });
  };

  useEffect(() => {
    const loadColleges = async () => {
      setCollegesLoading(true);
      try {
        const response = await fetch('/api/colleges');
        if (response.ok) {
          const data = await response.json();
          setColleges(data.data || []);
        }
      } catch (fetchError) {
        console.error('Failed to fetch colleges:', fetchError);
      } finally {
        setCollegesLoading(false);
      }
    };

    loadColleges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.role === 'USER' && !formData.collegeId && !formData.collegeName.trim()) {
      setError('Please select your college');
      return;
    }

    if (formData.role === 'ORGANIZER') {
      if (!formData.organizationChoice) {
        setError('Please select your college or choose Other');
        return;
      }

      if (formData.organizationChoice === 'OTHER' && !formData.organizationName.trim()) {
        setError('College name is required');
        return;
      }

      if (!formData.contactNumber.trim()) {
        setError('Contact number is required');
        return;
      }

      if (!formData.reason.trim()) {
        setError('Please share why you need organizer access');
        return;
      }
    }

    setLoading(true);

    try {
      const { confirmPassword, organizationChoice, collegeChoice, ...registerData } = formData;

      // Create payload based on role
      const payload: any = {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
      };

      // Add college fields only for USER role
      if (formData.role === 'USER') {
        if (registerData.collegeId) {
          payload.collegeId = registerData.collegeId;
        }
        if (registerData.collegeName) {
          payload.collegeName = registerData.collegeName;
        }
      }

      // Add organization fields only for ORGANIZER role
      if (formData.role === 'ORGANIZER') {
        payload.organizationName = registerData.organizationName;
        payload.contactNumber = registerData.contactNumber;
        payload.reason = registerData.reason;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (formData.role === 'ORGANIZER') {
          router.push('/waiting-for-approval');
        } else {
          router.push('/login?registered=true');
        }
      } else {
        const data = await response.json();
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          setError(data.errors[0]?.message || data.message || 'Registration failed');
        } else {
          setError(data.message || data.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      headerActions={[{ href: '/login', label: 'Log in' }]}
      centerContent={
        <div className="items-center gap-5 text-sm md:flex">
          <button
            type="button"
            onClick={() => handleRoleSelect('USER')}
            className={`transition ${roleLinkClass('USER')}`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('ORGANIZER')}
            className={`transition ${roleLinkClass('ORGANIZER')}`}
          >
            Organiser
          </button>
        </div>
      }
      mainClassName="flex-1 flex items-center justify-center px-6 py-10"
    >
      <AuthCard className="p-7">
            <div className="text-center mb-6">
              <h1 className="mt-3 text-3xl font-normal bg-gradient-to-r from-pink-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
                Create your account
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-center gap-5 text-sm md:hidden">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('USER')}
                  className={`transition ${roleLinkClass('USER')}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('ORGANIZER')}
                  className={`transition ${roleLinkClass('ORGANIZER')}`}
                >
                  Organiser
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AuthField
                  id="firstName"
                  name="firstName"
                  label="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Harsith"
                  required
                />

                <AuthField
                  id="lastName"
                  name="lastName"
                  label="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Bheesetti"
                  required
                />
              </div>

              <AuthField
                id="email"
                name="email"
                label="Email address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your college mail id"
                required
              />

              <AuthField
                id="password"
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              <AuthField
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              {formData.role === 'USER' && (
                <>
                  <div>
                    <label htmlFor="collegeId" className="block text-sm text-white mb-2">
                      College
                    </label>
                    <Select
                      value={formData.collegeChoice || formData.collegeId}
                      onValueChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          collegeChoice: value,
                          collegeId: value === 'OTHER' ? '' : value,
                          collegeName: value === 'OTHER' ? '' : prev.collegeName,
                        }));
                      }}
                      disabled={collegesLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={collegesLoading ? 'Loading colleges...' : 'Select your college'} />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((college) => (
                          <SelectItem key={college.id} value={college.id}>
                            {college.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.collegeChoice === 'OTHER' && (
                    <div>
                      <label htmlFor="collegeName" className="block text-sm text-white mb-2">
                        College name
                      </label>
                      <input
                        id="collegeName"
                        name="collegeName"
                        type="text"
                        value={formData.collegeName}
                        onChange={handleChange}
                        placeholder="Your college name"
                        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white placeholder:text-soft focus:border-neon focus:outline-none transition"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {formData.role === 'ORGANIZER' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="organizationChoice" className="block text-sm text-white mb-2">
                      College
                    </label>
                    <Select
                      value={formData.organizationChoice}
                      onValueChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          organizationChoice: value,
                          organizationName: value,
                        }));
                      }}
                      disabled={collegesLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={collegesLoading ? 'Loading colleges...' : 'Select your college'} />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((college) => (
                          <SelectItem key={college.id} value={college.name}>
                            {college.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="contactNumber" className="block text-sm text-white mb-2">
                      Contact number
                    </label>
                    <input
                      id="contactNumber"
                      name="contactNumber"
                      type="text"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white placeholder:text-soft focus:border-neon focus:outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm text-white mb-2">
                      Why do you need organizer access?
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="Share the events you plan to host"
                      className="w-full min-h-[110px] rounded-2xl border border-white/10 bg-black px-4 py-3 text-white placeholder:text-soft focus:border-neon focus:outline-none transition"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-full border-strong bg-white/10 text-white font-medium transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-neon hover:underline">
                Sign in
              </Link>
            </div>
      </AuthCard>
    </PublicAuthLayout>
  );
}
