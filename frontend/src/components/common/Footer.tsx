import React from 'react';
import { Link } from '@tanstack/react-router';
import { Instagram, Facebook, Twitter, Linkedin, Mail, ShoppingBag } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#FF6B8B] via-[#FF8E53] to-[#FFB347] rounded-xl shadow-lg">
                <span className="text-white font-display font-bold text-2xl italic" style={{textShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>V</span>
              </div>
              <span className="text-2xl font-display font-bold">Vici Shop</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your one-stop destination for trendy and quality products. Shop with confidence and style.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#FF6B8B] flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#FF6B8B] flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#FF6B8B] flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#FF6B8B] flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">Shop</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/shop" className="hover:text-[#FF6B8B] transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Electronics" className="hover:text-[#FF6B8B] transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Fashion" className="hover:text-[#FF6B8B] transition-colors">
                  Fashion
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Home" className="hover:text-[#FF6B8B] transition-colors">
                  Home & Living
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-bold text-lg mb-4">Customer Service</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/contact" className="hover:text-[#FF6B8B] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-[#FF6B8B] transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-[#FF6B8B] transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#FF6B8B] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-lg mb-4">Stay Connected</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get special offers and updates
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] text-sm"
              />
              <button className="px-4 py-2 bg-[#FF6B8B] hover:bg-[#E64A6B] rounded-lg transition-colors">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2024 Vici Shop. All rights reserved.</p>
          <div className="flex gap-6 text-gray-500 text-sm">
            <Link to="/privacy" className="hover:text-[#FF6B8B] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#FF6B8B] transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="hover:text-[#FF6B8B] transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
