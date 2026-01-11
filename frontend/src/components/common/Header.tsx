import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { ShoppingCart, Search, User as UserIcon, Menu, X, Package, LogOut } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const { items, getItemCount } = useCartStore();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed w-full top-0 z-[100] transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
            <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#FF6B8B] via-[#FF8E53] to-[#FFB347] rounded-xl transform group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl">
              <span className="text-white font-display font-bold text-2xl italic" style={{textShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>V</span>
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight ml-1">
              Vici Shop
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { path: '/', label: 'Home' },
              { path: '/shop', label: 'Shop' },
              { path: '/contact', label: 'Contact' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={cn(
                  'px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300',
                  isActive(link.path)
                    ? 'bg-[#FFF0F3] text-[#FF6B8B]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={cn(
                  'px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300',
                  isActive('/admin')
                    ? 'bg-[#FFF0F3] text-[#FF6B8B]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex relative group">
              <Input
                type="text"
                placeholder="Search goodies..."
                className="w-48 pl-10 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:w-64 transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <Link to="/cart" className="relative p-2.5 bg-gray-50 rounded-full text-gray-600 hover:text-[#FF6B8B] hover:bg-[#FFF0F3] transition-all group">
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B8B] text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                  {getItemCount()}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group py-2">
                <button className="flex items-center gap-2 focus:outline-none">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#4ECDC4] to-[#3DBEB6] p-0.5 shadow-md group-hover:ring-4 ring-[#E6FFFA] transition-all">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-sm font-bold text-[#4ECDC4]">{user.name.charAt(0)}</span>
                    </div>
                  </div>
                </button>
                <div className="absolute right-0 top-full h-3 w-full"></div>

                <div className="absolute right-0 top-[calc(100%+0.5rem)] w-64 bg-white rounded-3xl shadow-pop py-3 ring-1 ring-black ring-opacity-5 hidden group-hover:block transition-all transform origin-top-right border border-gray-100 animate-slideUp z-50">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#FFF0F3] flex items-center justify-center text-[#FF6B8B] font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link
                      to="/dashboard"
                      className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-[#FFF0F3] hover:text-[#FF6B8B] flex items-center gap-3 transition-colors"
                    >
                      <UserIcon className="w-4 h-4" /> Account Details
                    </Link>
                    <Link
                      to="/orders"
                      className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-[#FFF0F3] hover:text-[#FF6B8B] flex items-center gap-3 transition-colors"
                    >
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    <div className="h-px bg-gray-50 my-1 mx-2"></div>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login">
                <Button className="hidden sm:flex items-center justify-center px-6 py-2.5 text-sm font-bold bg-[#FF6B8B] hover:bg-[#E64A6B] shadow-md shadow-rose-200">
                  Login
                </Button>
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 absolute w-full shadow-xl rounded-b-3xl">
          <div className="pt-4 pb-6 space-y-2 px-6">
            <Link
              to="/"
              className="block py-3 px-4 rounded-2xl bg-[#FFF0F3] text-[#FF6B8B] font-bold"
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="block py-3 px-4 rounded-2xl text-gray-600 hover:bg-gray-50 font-bold"
            >
              Shop
            </Link>
            <Link
              to="/contact"
              className="block py-3 px-4 rounded-2xl text-gray-600 hover:bg-gray-50 font-bold"
            >
              Contact Us
            </Link>
            {!user && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Link
                  to="/login"
                  className="block py-3 px-4 rounded-2xl text-center bg-gray-100 text-gray-900 font-bold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-3 px-4 rounded-2xl text-center bg-[#FF6B8B] text-white font-bold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
