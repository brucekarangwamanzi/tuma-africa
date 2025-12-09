import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  currency: string;
  agreeToTerms: boolean;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        currency: data.currency || 'USD'
      });
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response?.status === 400) {
        const message = error.response.data.message;
        if (message.includes('email')) {
          setError('email', { message });
        } else if (message.includes('phone')) {
          setError('phone', { message });
        } else {
          setError('email', { message });
        }
      } else {
        setError('email', { message: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const companyName = settings?.companyInfo?.name || 'Tuma-Africa Link Cargo';
  const registrationEnabled = settings?.features?.registrationEnabled !== false;

  if (!registrationEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-soft p-8 text-center">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Temporarily Disabled</h2>
          <p className="text-gray-600 mb-6">
            New user registrations are currently disabled. Please contact support for assistance.
          </p>
          <div className="space-y-3">
            <Link to="/login" className="btn-primary w-full">
              Sign In Instead
            </Link>
            <Link to="/" className="btn-outline w-full">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join {companyName} and start ordering from Asia
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="fullName" className="label">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    {...register('fullName', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Full name must be at least 2 characters'
                      },
                      pattern: {
                        value: /^[a-zA-Z\s]+$/,
                        message: 'Full name can only contain letters and spaces'
                      }
                    })}
                    className={`input pl-10 ${errors.fullName ? 'input-error' : ''}`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-error-600">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Phone Number
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^\+?[\d\s\-()]{10,}$/,
                        message: 'Please enter a valid phone number'
                      }
                    })}
                    className={`input pl-10 ${errors.phone ? 'input-error' : ''}`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="currency" className="label">
                  Preferred Currency
                </label>
                <select
                  id="currency"
                  {...register('currency', {
                    required: 'Currency selection is required'
                  })}
                  className={`input ${errors.currency ? 'input-error' : ''}`}
                  defaultValue="USD"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="RWF">RWF - Rwandan Franc</option>
                  <option value="Yuan">Yuan - Chinese Yuan</option>
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-error-600">{errors.currency.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                      }
                    })}
                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                )}
                
                {/* Password Requirements */}
                <div className="mt-2 space-y-1">
                  <div className={`flex items-center text-xs ${
                    password && password.length >= 6 ? 'text-success-600' : 'text-gray-500'
                  }`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    At least 6 characters
                  </div>
                  <div className={`flex items-center text-xs ${
                    password && /(?=.*[a-z])(?=.*[A-Z])/.test(password) ? 'text-success-600' : 'text-gray-500'
                  }`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Upper and lowercase letters
                  </div>
                  <div className={`flex items-center text-xs ${
                    password && /(?=.*\d)/.test(password) ? 'text-success-600' : 'text-gray-500'
                  }`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    At least one number
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password'
                    })}
                    className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  {...register('agreeToTerms', {
                    required: 'You must agree to the terms and conditions'
                  })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-error-600">{errors.agreeToTerms.message}</p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex justify-center items-center"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/login"
                  className="btn-outline w-full flex justify-center items-center"
                >
                  Sign in to your account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image/Content */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div 
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            backgroundImage: settings?.heroSection?.backgroundImage 
              ? `url(${settings.heroSection.backgroundImage})`
              : 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center h-full px-12 text-white">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold mb-4">
                Start Your Journey
              </h1>
              <p className="text-xl text-gray-200 mb-8">
                Join thousands of satisfied customers who trust us with their cargo needs
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-400 rounded-full" />
                  <span>Easy Product Sourcing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-400 rounded-full" />
                  <span>Competitive Pricing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-400 rounded-full" />
                  <span>Fast & Secure Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;