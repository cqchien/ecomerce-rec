import { useState, useEffect, useCallback } from 'react';
import { getOrderService } from '@/services';
import type { Order, OrderStatus } from '@/services/api/order.service';

export const useOrders = (page = 1, limit = 10, status?: OrderStatus) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const orderService = getOrderService();

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await (orderService as any).getOrders(page, limit, status);
      // Handle both array (mock) and paginated response (API)
      if (Array.isArray(response)) {
        setOrders(response as Order[]);
        setPagination({
          page: 1,
          limit: response.length,
          total: response.length,
          totalPages: 1,
        });
      } else {
        setOrders(response.data as Order[]);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    pagination,
    refetch: fetchOrders,
  };
};

export const useOrder = (orderId?: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const orderService = getOrderService();

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Check which method is available
        let data: Order | null = null;
        if ('getOrder' in orderService) {
          data = await (orderService as any).getOrder(orderId);
        } else if ('getOrderById' in orderService) {
          data = await (orderService as any).getOrderById(orderId);
        }
        setOrder(data);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return { order, isLoading, error };
};

export const useCancelOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const orderService = getOrderService();

  const cancelOrder = async (orderId: string): Promise<Order | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.cancelOrder(orderId);
      // API returns Order, mock returns void
      return data || null;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to cancel order:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { cancelOrder, isLoading, error };
};
