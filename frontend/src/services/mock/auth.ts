import usersData from '@/data/users.json';
import { sleep } from '@/lib/utils';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  avatar?: string;
  phone?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export const mockAuthService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await sleep(500); // Simulate network delay

    const user = usersData.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      token: 'mock-jwt-token-' + Date.now(),
    };
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    await sleep(500);

    // Check if user already exists
    const existingUser = usersData.find((u) => u.email === data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create new user
    const newUser: User = {
      id: String(usersData.length + 1),
      email: data.email,
      name: data.name,
      role: 'customer',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=FF6B8B&color=fff`,
    };

    return {
      user: newUser,
      token: 'mock-jwt-token-' + Date.now(),
    };
  },

  async logout(): Promise<void> {
    await sleep(200);
    // Clear any session data
  },

  async getCurrentUser(token: string): Promise<User | null> {
    await sleep(200);
    // In a real app, this would validate the token
    // For mock, we'll just return the first customer
    const user = usersData.find((u) => u.role === 'customer');
    if (!user) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    await sleep(300);
    // In real app, this would update the database
    const user = usersData.find((u) => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, ...data } as User;
  },
};
