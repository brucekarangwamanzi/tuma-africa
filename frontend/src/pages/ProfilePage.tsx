import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, MapPin, Camera, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface ProfileFormData {
  fullName: string;
  phone: string;
  currency: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      currency: user?.currency || 'USD',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        country: user?.address?.country || '',
        zipCode: user?.address?.zipCode || ''
      }
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      const response = await axios.put('/users/profile', data);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsUpdating(true);
    try {
      await axios.put('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      toast.success('Password changed successfully!');
      resetPassword();
    } catch (error: any) {
      console.error('Password change error:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imageUrl = response.data.imageUrl;
      
      // Update profile with new image
      const profileResponse = await axios.put('/users/profile', {
        profileImage: imageUrl
      });
      
      updateUser(profileResponse.data.user);
      toast.success('Profile image updated successfully!');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-6 text-center">
              <div className="relative inline-block mb-4">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.fullName}
                    className="w-24 h-24 rounded-full object-cover mx-auto"
                  />
                ) : (
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <User className="h-12 w-12 text-primary-600" />
                  </div>
                )}
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors"
                >
                  <Camera className="h-4 w-4 text-white" />
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900">{user.fullName}</h3>
              <p className="text-gray-600 text-sm">{user.email}</p>
              
              <div className="mt-4 space-y-2">
                <div className={`inline-block px-3 py-1 text-xs rounded-full ${
                  user.role === 'super_admin' 
                    ? 'bg-purple-100 text-purple-800'
                    : user.role === 'admin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role.replace('_', ' ').toUpperCase()}
                </div>
                
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className={`flex items-center ${user.verified ? 'text-success-600' : 'text-warning-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${user.verified ? 'bg-success-500' : 'bg-warning-500'}`} />
                    {user.verified ? 'Verified' : 'Unverified'}
                  </div>
                  <div className={`flex items-center ${user.approved ? 'text-success-600' : 'text-warning-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${user.approved ? 'bg-success-500' : 'bg-warning-500'}`} />
                    {user.approved ? 'Approved' : 'Pending'}
                  </div>
                </div>
                
                {!user.verified && (
                  <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-xs text-warning-800 mb-2">
                      Please verify your email address to access all features.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          await axios.post('/users/verify-email');
                          toast.success('Verification email sent! Please check your inbox.');
                        } catch (error: any) {
                          toast.error(error.response?.data?.message || 'Failed to send verification email');
                        }
                      }}
                      className="text-xs text-warning-700 hover:text-warning-900 font-medium underline"
                    >
                      Resend Verification Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Settings Forms */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-soft">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'profile'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Profile Information
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'password'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Change Password
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Profile Information Tab */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="label">Full Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            {...registerProfile('fullName', {
                              required: 'Full name is required',
                              minLength: { value: 2, message: 'Name must be at least 2 characters' }
                            })}
                            className={`input pl-10 ${profileErrors.fullName ? 'input-error' : ''}`}
                            placeholder="Enter your full name"
                          />
                        </div>
                        {profileErrors.fullName && (
                          <p className="text-error-600 text-sm mt-1">{profileErrors.fullName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label">Email Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="input pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="label">Phone Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            {...registerProfile('phone', {
                              required: 'Phone number is required',
                              pattern: {
                                value: /^\+?[\d\s\-\(\)]{10,}$/,
                                message: 'Please enter a valid phone number'
                              }
                            })}
                            className={`input pl-10 ${profileErrors.phone ? 'input-error' : ''}`}
                            placeholder="Enter your phone number"
                          />
                        </div>
                        {profileErrors.phone && (
                          <p className="text-error-600 text-sm mt-1">{profileErrors.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label">Preferred Currency</label>
                        <select
                          {...registerProfile('currency', {
                            required: 'Currency is required'
                          })}
                          className={`input ${profileErrors.currency ? 'input-error' : ''}`}
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="RWF">RWF - Rwandan Franc</option>
                          <option value="Yuan">Yuan - Chinese Yuan</option>
                        </select>
                        {profileErrors.currency && (
                          <p className="text-error-600 text-sm mt-1">{profileErrors.currency.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Address Section */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Address Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="label">Street Address</label>
                          <input
                            type="text"
                            {...registerProfile('address.street')}
                            className="input"
                            placeholder="Enter your street address"
                          />
                        </div>

                        <div>
                          <label className="label">City</label>
                          <input
                            type="text"
                            {...registerProfile('address.city')}
                            className="input"
                            placeholder="Enter your city"
                          />
                        </div>

                        <div>
                          <label className="label">State/Province</label>
                          <input
                            type="text"
                            {...registerProfile('address.state')}
                            className="input"
                            placeholder="Enter your state/province"
                          />
                        </div>

                        <div>
                          <label className="label">Country</label>
                          <input
                            type="text"
                            {...registerProfile('address.country')}
                            className="input"
                            placeholder="Enter your country"
                          />
                        </div>

                        <div>
                          <label className="label">ZIP/Postal Code</label>
                          <input
                            type="text"
                            {...registerProfile('address.zipCode')}
                            className="input"
                            placeholder="Enter your ZIP/postal code"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="btn-primary flex items-center"
                      >
                        {isUpdating ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {isUpdating ? 'Updating...' : 'Update Profile'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Change Password Tab */}
                {activeTab === 'password' && (
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                    <div className="space-y-6">
                      <div>
                        <label className="label">Current Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            {...registerPassword('currentPassword', {
                              required: 'Current password is required'
                            })}
                            className={`input pl-10 pr-10 ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                            placeholder="Enter your current password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-error-600 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label">New Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            {...registerPassword('newPassword', {
                              required: 'New password is required',
                              minLength: { value: 6, message: 'Password must be at least 6 characters' },
                              pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Password must contain uppercase, lowercase, and number'
                              }
                            })}
                            className={`input pl-10 pr-10 ${passwordErrors.newPassword ? 'input-error' : ''}`}
                            placeholder="Enter your new password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="text-error-600 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label">Confirm New Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...registerPassword('confirmPassword', {
                              required: 'Please confirm your new password',
                              validate: (value) => value === newPassword || 'Passwords do not match'
                            })}
                            className={`input pl-10 pr-10 ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                            placeholder="Confirm your new password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="text-error-600 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• At least 6 characters long</li>
                        <li>• Contains at least one uppercase letter</li>
                        <li>• Contains at least one lowercase letter</li>
                        <li>• Contains at least one number</li>
                      </ul>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="btn-primary flex items-center"
                      >
                        {isUpdating ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Lock className="h-4 w-4 mr-2" />
                        )}
                        {isUpdating ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;