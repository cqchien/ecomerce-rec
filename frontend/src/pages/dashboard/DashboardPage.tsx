import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Package,
  User,
  MapPin,
  CreditCard,
  LogOut,
  ChevronRight,
  ShoppingBag,
  Edit2,
  Camera,
  Lock,
  Mail,
  Phone,
  Save,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import orders from '@/data/orders.json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TabType = 'orders' | 'profile';

export const DashboardPage: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <Link to="/login">
            <Button className="px-8 py-3 bg-[#FF6B8B] hover:bg-[#E64A6B] text-white font-bold rounded-xl">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter orders for current user
  const userOrders = orders.filter((order) => order.userId === user.id);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-500 font-medium">Manage your orders and account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden sticky top-28">
              {/* User Profile Header */}
              <div className="p-8 bg-gradient-to-br from-[#FF6B8B] to-[#FF8E53] text-white text-center relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-[-50%] left-[-50%] w-full h-full border-[20px] border-white/10 rounded-full"></div>
                <div className="absolute bottom-[-50%] right-[-50%] w-full h-full border-[20px] border-white/10 rounded-full"></div>

                <div className="relative z-10">
                  <div className="w-24 h-24 rounded-full bg-white p-1 mx-auto mb-4 shadow-lg">
                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-[#FF6B8B] overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                  <h2 className="font-display font-bold text-xl mb-1">{user.name}</h2>
                  <p className="text-white/80 text-sm font-medium">{user.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-4 space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'orders'
                      ? 'bg-[#FFF0F3] text-[#FF6B8B] shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5" />
                    Orders
                  </div>
                  {activeTab === 'orders' && <ChevronRight className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'profile'
                      ? 'bg-[#FFF0F3] text-[#FF6B8B] shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    Profile Settings
                  </div>
                  {activeTab === 'profile' && <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="my-2 border-t border-gray-100 mx-4"></div>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'orders' ? (
              <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 min-h-[500px]">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <span className="p-3 bg-[#E6FFFA] text-[#4ECDC4] rounded-xl">
                    <ShoppingBag className="w-6 h-6" />
                  </span>
                  Order History
                </h2>

                {userOrders.length > 0 ? (
                  <div className="space-y-6">
                    {userOrders.map((order) => (
                      <div
                        key={order.id}
                        className="group border-2 border-gray-50 rounded-3xl p-6 hover:border-[#FFE3E8] hover:shadow-lg transition-all bg-white"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-display font-bold text-lg text-gray-900">
                                {order.id}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  order.status === 'Delivered'
                                    ? 'bg-green-100 text-green-700'
                                    : order.status === 'Shipped'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">
                              Placed on {new Date(order.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-display font-bold text-xl text-gray-900">
                              ${order.total.toFixed(2)}
                            </p>
                            <Link
                              to="#"
                              className="text-sm font-bold text-[#FF6B8B] hover:text-[#E64A6B] hover:underline"
                            >
                              View Invoice
                            </Link>
                          </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          ))}
                        </div>

                        {order.tracking && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Tracking:</span>{' '}
                              {order.tracking.number}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium text-lg">No orders yet.</p>
                    <Link to="/shop">
                      <Button className="mt-4 px-6 py-3 bg-[#FF6B8B] hover:bg-[#E64A6B] text-white font-bold rounded-xl">
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <span className="p-3 bg-[#FFF0F3] text-[#FF6B8B] rounded-xl">
                    <User className="w-6 h-6" />
                  </span>
                  Profile Details
                </h2>

                <div className="space-y-8 max-w-2xl">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden border-4 border-white shadow-lg">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-[#4ECDC4] text-white rounded-full shadow-md hover:bg-[#3DBEB6] transition-colors border-2 border-white">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Profile Photo</h3>
                      <p className="text-sm text-gray-500 mb-3">Update your dashboard avatar.</p>
                      <Button
                        variant="outline"
                        className="px-4 py-2 border-2 border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:border-[#FF6B8B] hover:text-[#FF6B8B]"
                      >
                        Upload New
                      </Button>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName" className="text-gray-700 font-bold mb-2 ml-3">
                        Full Name
                      </Label>
                      <div className="relative mt-2">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="fullName"
                          type="text"
                          defaultValue={user.name}
                          className="pl-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#FF6B8B] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-gray-700 font-bold mb-2 ml-3">
                        Phone Number
                      </Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          className="pl-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#FF6B8B] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="email" className="text-gray-700 font-bold mb-2 ml-3">
                        Email Address
                      </Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          defaultValue={user.email}
                          className="pl-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#FF6B8B] focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="currentPassword" className="text-gray-700 font-bold mb-2 ml-3">
                          Current Password
                        </Label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="currentPassword"
                            type="password"
                            placeholder="••••••••"
                            className="pl-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#FF6B8B] focus:bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newPassword" className="text-gray-700 font-bold mb-2 ml-3">
                          New Password
                        </Label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••"
                            className="pl-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#FF6B8B] focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button className="px-8 py-3.5 bg-[#4ECDC4] hover:bg-[#3DBEB6] text-white rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2">
                      <Save className="w-5 h-5" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
