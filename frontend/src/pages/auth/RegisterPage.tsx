import React, { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { Mail, Lock, Eye, EyeOff, User, Chrome, Facebook, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      // Mock registration - in real app, call API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create user object
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        role: 'customer' as const,
      };

      setUser(newUser);
      navigate({ to: '/dashboard' });
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                {error}
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
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="pl-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#4ECDC4] focus:bg-white"
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
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="pl-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#4ECDC4] focus:bg-white"
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
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="pl-12 pr-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#4ECDC4] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
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
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="pl-12 pr-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#4ECDC4] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 text-[#4ECDC4] border-gray-300 rounded focus:ring-[#4ECDC4]"
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
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-[#4ECDC4] to-[#44A3A0] hover:from-[#3DBEB6] hover:to-[#3A8F8C] text-white font-bold text-lg rounded-xl shadow-lg hover:-translate-y-1 transition-all"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
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
            {[
              'Exclusive member discounts',
              'Early access to new products',
              'Free shipping on orders over $50',
              'Birthday rewards and special offers',
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-gray-600">
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
