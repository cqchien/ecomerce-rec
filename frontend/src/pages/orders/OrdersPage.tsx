import React, { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Package,
  Search,
  Filter,
  ChevronDown,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
  MapPin,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useOrders } from '@/hooks';
import type { OrderStatus as ApiOrderStatus } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type OrderStatus = 'All' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const statusConfig = {
  PROCESSING: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  SHIPPED: { color: 'bg-blue-100 text-blue-700', icon: Truck },
  DELIVERED: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

export const OrdersPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('All');
  const { orders = [], isLoading } = useOrders(1, 50, statusFilter !== 'All' ? statusFilter as ApiOrderStatus : undefined);

  // Client-side search filter
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    
    return orders.filter(
      (order) =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [orders, searchQuery]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center py-20">
          <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Please Log In to View Orders
          </h2>
          <p className="text-gray-500 mb-8">You need to be logged in to access your order history.</p>
          <Link to="/login">
            <Button className="px-8 py-6 bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] hover:from-[#E64A6B] hover:to-[#E67D42] text-white font-bold rounded-xl shadow-lg">
              Login Now
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = {
    total: filteredOrders.length,
    processing: filteredOrders.filter((o) => o.status === 'PROCESSING').length,
    shipped: filteredOrders.filter((o) => o.status === 'SHIPPED').length,
    delivered: filteredOrders.filter((o) => o.status === 'DELIVERED').length,
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-500 font-medium">Track and manage your orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: stats.total, color: 'from-purple-500 to-purple-600', icon: Package },
            { label: 'Processing', value: stats.processing, color: 'from-yellow-500 to-yellow-600', icon: Clock },
            { label: 'Shipped', value: stats.shipped, color: 'from-blue-500 to-blue-600', icon: Truck },
            { label: 'Delivered', value: stats.delivered, color: 'from-green-500 to-green-600', icon: CheckCircle },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by order ID or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#FF6B8B]"
              />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
                className="w-full h-12 px-4 pr-10 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-700 focus:border-[#FF6B8B] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative min-w-[200px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'total')}
                className="w-full h-12 px-4 pr-10 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-700 focus:border-[#FF6B8B] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="date">Sort by Date</option>
                <option value="total">Sort by Total</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Package;
              const statusColor = statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-700';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="font-display font-bold text-xl text-gray-900">{order.id}</span>
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor} flex items-center gap-1.5`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="group">
                          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          <p className="text-sm font-bold text-[#FF6B8B]">${item.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#E6FFFA] rounded-lg">
                            <MapPin className="w-5 h-5 text-[#4ECDC4]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">Shipping Address</h4>
                            <p className="text-sm text-gray-600">
                              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{order.shippingAddress.addressLine1}</p>
                            <p className="text-sm text-gray-600">
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                            </p>
                            <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tracking Info */}
                    {order.tracking && (
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-bold text-blue-900 mb-1">Tracking Information</h4>
                            <p className="text-sm text-blue-700">
                              <span className="font-semibold">{order.tracking.carrier}</span> - {order.tracking.number}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 sm:flex-none border-2 border-gray-200 rounded-xl font-bold hover:border-[#FF6B8B] hover:bg-[#FFF0F3] hover:text-[#FF6B8B]"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {order.tracking && (
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none border-2 border-gray-200 rounded-xl font-bold hover:border-[#4ECDC4] hover:bg-[#E6FFFA] hover:text-[#4ECDC4]"
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Track Order
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="flex-1 sm:flex-none border-2 border-gray-200 rounded-xl font-bold hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-8">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your filters or search query'
                : "You haven't placed any orders yet"}
            </p>
            {!searchQuery && statusFilter === 'All' && (
              <Link to="/shop">
                <Button className="px-8 py-6 bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] hover:from-[#E64A6B] hover:to-[#E67D42] text-white font-bold rounded-xl shadow-lg">
                  Start Shopping
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
