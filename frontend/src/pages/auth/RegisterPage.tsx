import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User, Chrome, Facebook, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuthService } from '@/services';

const PASSWORD_MIN_LENGTH = 8;
const BENEFITS = [
  'Exclusive member discounts',
  'Early access to new products',
  'Free shipping on orders over $50',
  'Birthday rewards and special offers',
] as const;

// Zod schema for form validation
const registerSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { fetchCart } = useCartStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const authService = useMemo(() => getAuthService(), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur', // Validate on blur for better UX
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    setApiError('');

    try {
      const response = await authService.register({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      setUser(response.user);
      await fetchCart();
      navigate({ to: '/dashboard' });
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setApiError(errorMessage);
    }
  }, [authService, setUser, fetchCart, navigate]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Get the first error to display (priority: API error, then form errors)
  const displayError = apiError || 
    errors.name?.message || 
    errors.email?.message || 
    errors.password?.message || 
    errors.confirmPassword?.message || 
    errors.agreeToTerms?.message;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#E6FFFA] pt-24 pb-20">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500 font-medium">Join us and start shopping today</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-8">
          {/* Social Register */}
          <div className="space-y-3 mb-8">
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#4ECDC4] hover:bg-[#E6FFFA] hover:text-[#4ECDC4]"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Sign up with Google
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#4267B2] hover:bg-[#EBF3FF] hover:text-[#4267B2]"
            >
              <Facebook className="w-5 h-5 mr-2" />
              Sign up with Facebook
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or register with email</span>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {displayError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                {displayError}
              </div>
            )}

            <div>
              <Label htmlFor="name" className="text-gray-700 font-bold">
                Full Name
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  {...register('name')}
                  disabled={isSubmitting}
                  className={`pl-12 h-12 bg-gray-50 border-2 rounded-xl focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:border-[#4ECDC4]'
                  }`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-bold">
                Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  disabled={isSubmitting}
                  className={`pl-12 h-12 bg-gray-50 border-2 rounded-xl focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:border-[#4ECDC4]'
                  }`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-bold">
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isSubmitting}
                  className={`pl-12 pr-12 h-12 bg-gray-50 border-2 rounded-xl focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:border-[#4ECDC4]'
                  }`}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must include uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700 font-bold">
                Confirm Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  disabled={isSubmitting}
                  className={`pl-12 pr-12 h-12 bg-gray-50 border-2 rounded-xl focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:border-[#4ECDC4]'
                  }`}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  {...register('agreeToTerms')}
                  disabled={isSubmitting}
                  className={`w-4 h-4 border-gray-300 rounded focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.agreeToTerms 
                      ? 'border-red-300 text-red-500 focus:ring-red-500' 
                      : 'text-[#4ECDC4] focus:ring-[#4ECDC4]'
                  }`}
                />
              </div>
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-[#4ECDC4] hover:text-[#3DBEB6] font-bold hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[#4ECDC4] hover:text-[#3DBEB6] font-bold hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-gradient-to-r from-[#4ECDC4] to-[#44A3A0] hover:from-[#3DBEB6] hover:to-[#3A8F8C] text-white font-bold text-lg rounded-xl shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#4ECDC4] hover:text-[#3DBEB6] font-bold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Why join us?</h3>
          <ul className="space-y-3">
            {BENEFITS.map((benefit, index) => (
              <li key={benefit} className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
