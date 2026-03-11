'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import ProfileCameraModal from '@/components/profile/ProfileCameraModal';
import { PROFILE_BRANCHES, PROFILE_YEARS } from '@/lib/profile-form-options';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [colleges, setColleges] = useState<Array<{ id: string; name: string }>>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
    gender: '',
    dateOfBirth: '',
    college: '',
    customCollege: '',
    year: 1,
    branch: '',
    customBranch: '',
    collegeId: '',
    city: '',
    state: '',
    country: 'India',
    profilePhoto: '',
  });

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setCollegesLoading(true);
        const response = await fetch('/api/colleges');
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }

        const data = await response.json();
        const list = data?.data || [];
        setColleges(list);
        return list as Array<{ id: string; name: string }>;
      } catch (err) {
        console.error('Error fetching colleges:', err);
        setColleges([]);
        return [] as Array<{ id: string; name: string }>;
      } finally {
        setCollegesLoading(false);
      }
    };

    const fetchUserData = async (collegeList: Array<{ id: string; name: string }>) => {
      try {
        const response = await fetch('/api/profile/complete');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();

        // If profile already complete, redirect to dashboard
        if (data.isProfileComplete) {
          router.push('/dashboard');
          return;
        }

        const hasCollegeMatch = collegeList.some((college) => college.name === data.college);

        // Prefill form with existing data
        setFormData((prev) => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          college: hasCollegeMatch ? data.college || '' : data.college ? 'OTHER' : '',
          customCollege: hasCollegeMatch ? '' : data.college || '',
          collegeId: '',
        }));
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your information');
      } finally {
        setInitialLoading(false);
      }
    };

    const bootstrap = async () => {
      const collegeList = await fetchColleges();
      await fetchUserData(collegeList);
    };

    bootstrap();

    // Cleanup: Stop camera on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [router]);

  // Set mounted flag for portal rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Convert to base64 for storage
      const base64 = await convertToBase64(file);
      setFormData((prev) => ({
        ...prev,
        profilePhoto: base64,
      }));
      
      setError('');
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image');
    } finally {
      setUploadingImage(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setError('');

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      
      // Open modal first
      setCameraOpen(true);
      
      // Then set the video stream with a small delay to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => {
              console.error('Play error:', err);
            });
          };
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraOpen(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please grant camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Failed to access camera. ' + err.message);
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

      // Set canvas size to match video
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      // Draw video frame to canvas
      context.drawImage(videoRef.current, 0, 0);

      // Convert canvas to base64
      const base64 = canvasRef.current.toDataURL('image/jpeg', 0.9);
      
      // Set preview and form data
      setImagePreview(base64);
      setFormData((prev) => ({
        ...prev,
        profilePhoto: base64,
      }));

      // Close camera
      stopCamera();
      setError('');
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.whatsapp) {
        throw new Error('WhatsApp number is required');
      }
      if (!formData.dateOfBirth) {
        throw new Error('Date of birth is required');
      }
      if (!formData.college) {
        throw new Error('College is required');
      }
      if (formData.college === 'OTHER' && !formData.customCollege) {
        throw new Error('Please enter your college name');
      }
      if (!formData.branch) {
        throw new Error('Branch is required');
      }
      if (formData.branch === 'OTHER' && !formData.customBranch) {
        throw new Error('Please specify your branch');
      }
      if (!formData.collegeId) {
        throw new Error('College ID is required');
      }
      if (!formData.city || !formData.state || !formData.country) {
        throw new Error('Address details are required');
      }

      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          college:
            formData.college === 'OTHER' ? formData.customCollege : formData.college,
          year: Number(formData.year),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete profile');
      }

      // Redirect to dashboard based on role
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-ink text-white flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white overflow-visible flex flex-col">
        {/* Header */}
        <header className="sticky top-4 z-40">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="relative flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 px-7 py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18),inset_1px_0_0_rgba(255,255,255,0.12),inset_-1px_0_0_rgba(255,255,255,0.12)] backdrop-blur">
            <Link href="/" className="flex items-center" aria-label="Home">
              <Image
                src="/branding/logo_dark_no_bg..svg"
                alt="Eventura"
                width={144}
                height={36}
                className="h-9 w-auto"
                priority
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          {/* Profile Completion Card */}
          <div className="glass card-glow rounded-3xl border-strong p-7">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-normal bg-gradient-to-r from-pink-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
                Complete Your Profile
              </h1>
              <p className="mt-3 text-sm text-muted">
                Please fill in your details to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-white">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white placeholder-muted focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white placeholder-muted focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-muted cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-white mb-2">
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white placeholder-muted focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-white mb-2">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20 [&>option]:bg-[#0a0a0a] [&>option]:text-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-white mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-white">Academic Information</h2>
                
                <div>
                  <label htmlFor="college" className="block text-sm font-medium text-white mb-2">
                    College Name *
                  </label>
                  <select
                    id="college"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20 [&>option]:bg-[#0a0a0a] [&>option]:text-white"
                  >
                    <option value="">Select College</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.name}>
                        {college.name}
                      </option>
                    ))}
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {formData.college === 'OTHER' && (
                  <div>
                    <label htmlFor="customCollege" className="block text-sm font-medium text-white mb-2">
                      Enter College Name *
                    </label>
                    <input
                      type="text"
                      id="customCollege"
                      name="customCollege"
                      value={formData.customCollege}
                      onChange={handleChange}
                      placeholder="Enter your college name"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white placeholder-muted focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-white mb-2">
                      Year *
                    </label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20 [&>option]:bg-[#0a0a0a] [&>option]:text-white"
                    >
                      {PROFILE_YEARS.map((year) => (
                        <option key={year} value={year}>
                          Year {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-white mb-2">
                      Branch *
                    </label>
                    <select
                      id="branch"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20 [&>option]:bg-[#0a0a0a] [&>option]:text-white"
                    >
                      <option value="">Select Branch</option>
                      {PROFILE_BRANCHES.map((branch) => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.branch === 'OTHER' && (
                  <div>
                    <label htmlFor="customBranch" className="block text-sm font-medium text-white mb-2">
                      Specify Your Branch *
                    </label>
                    <input
                      type="text"
                      id="customBranch"
                      name="customBranch"
                      value={formData.customBranch}
                      onChange={handleChange}
                      placeholder="Enter your branch"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white placeholder-muted focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="collegeId" className="block text-sm font-medium text-white mb-2">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    id="collegeId"
                    name="collegeId"
                    value={formData.collegeId}
                    onChange={handleChange}
                    placeholder="e.g., A22126510134"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white placeholder-muted focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-white">Location</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-white mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-muted focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-white mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-muted focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-white mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-muted focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/20"
                  />
                </div>
              </div>

              {/* Profile Photo */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-white">Profile Photo</h2>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="flex justify-center">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border border-white/20">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={uploadingImage || cameraLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {cameraLoading ? 'Opening...' : 'Take Photo'}
                  </button>
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {/* Hidden Canvas for capturing */}
                <canvas ref={canvasRef} className="hidden" />

                <p className="text-xs text-muted text-center">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-[0_10px_30px_rgba(239,68,68,0.3)] transition hover:shadow-[0_10px_40px_rgba(239,68,68,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Completing...' : 'Complete Profile'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
      <ProfileCameraModal
        isMounted={isMounted}
        isOpen={cameraOpen}
        videoRef={videoRef}
        onCancel={stopCamera}
        onCapture={capturePhoto}
      />
      <Footer />
    </>
  );
}
