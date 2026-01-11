import { User } from '../models/user.model';

/**
 * Repository interface for User domain model.
 * Defines contract for user persistence operations.
 */
export interface IUserRepository {
  /**
   * Find user by ID.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find all users.
   */
  findAll(): Promise<User[]>;

  /**
   * Find users with pagination.
   */
  findWithPagination(page: number, limit: number): Promise<{
    users: User[];
    total: number;
  }>;

  /**
   * Save user (create or update).
   */
  save(user: User): Promise<User>;

  /**
   * Delete user by ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Soft delete user by ID.
   */
  softDelete(id: string): Promise<void>;

  /**
   * Restore soft-deleted user.
   */
  restore(id: string): Promise<void>;

  /**
   * Check if email exists.
   */
  emailExists(email: string): Promise<boolean>;
}
