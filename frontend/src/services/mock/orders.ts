import ordersData from '@/data/orders.json';
import { sleep } from '@/lib/utils';

export interface Order {
  id: string;
  userId: string;
  date: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: Array<{
    productId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  tracking?: {
    number: string;
    carrier: string;
    url: string;
  };
}

export const mockOrderService = {
  async getOrders(userId: string): Promise<Order[]> {
    await sleep(300);
    return ordersData.filter((o) => o.userId === userId) as Order[];
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    await sleep(200);
    const order = ordersData.find((o) => o.id === orderId);
    return order ? (order as Order) : null;
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    await sleep(500);
    
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      userId: orderData.userId!,
      date: new Date().toISOString(),
      total: orderData.total!,
      subtotal: orderData.subtotal!,
      shipping: orderData.shipping || 0,
      tax: orderData.tax || 0,
      status: 'Processing',
      items: orderData.items!,
      shippingAddress: orderData.shippingAddress!,
    };

    return newOrder;
  },

  async cancelOrder(orderId: string): Promise<void> {
    await sleep(300);
    // In real app, this would update the database
    console.log('Cancelled order:', orderId);
  },
};
