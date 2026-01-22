import React, { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { Mail, Lock, Eye, EyeOff, Chrome, Facebook } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { fetchCart } = useCartStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Fetch cart and user details after successful login
      await fetchCart();
      navigate({ to: '/' });
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.message || 'Invalid email or password. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#FFF0F3] pt-24 pb-20">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500 font-medium">Sign in to your account to continue</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-8">
          {/* Social Login */}
          <div className="space-y-3 mb-8">
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#4ECDC4] hover:bg-[#E6FFFA] hover:text-[#4ECDC4]"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#4267B2] hover:bg-[#EBF3FF] hover:text-[#4267B2]"
            >
              <Facebook className="w-5 h-5 mr-2" />
              Continue with Facebook
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#FF6B8B] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="password" className="text-gray-700 font-bold">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#FF6B8B] hover:text-[#E64A6B] font-bold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#FF6B8B] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 text-[#FF6B8B] border-gray-300 rounded focus:ring-[#FF6B8B]"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 font-medium">
                Remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] hover:from-[#E64A6B] hover:to-[#E67D42] text-white font-bold text-lg rounded-xl shadow-lg hover:-translate-y-1 transition-all"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-[#FF6B8B] hover:text-[#E64A6B] font-bold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <p className="font-bold mb-2">Demo Credentials:</p>
          <p>Email: jane.doe@example.com</p>
          <p>Password: password123</p>
        </div>
      </div>
    </div>
  );
};
