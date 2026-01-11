import { Address } from '../models/address.model';

/**
 * Repository interface for Address domain model.
 * Defines contract for address persistence operations.
 */
export interface IAddressRepository {
  /**
   * Find address by ID.
   */
  findById(id: string): Promise<Address | null>;

  /**
   * Find all addresses for a user.
   */
  findByUserId(userId: string): Promise<Address[]>;

  /**
   * Find default address for a user.
   */
  findDefaultByUserId(userId: string): Promise<Address | null>;

  /**
   * Save address (create or update).
   */
  save(address: Address): Promise<Address>;

  /**
   * Delete address by ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Soft delete address by ID.
   */
  softDelete(id: string): Promise<void>;

  /**
   * Set address as default and unset others for user.
   */
  setAsDefault(id: string, userId: string): Promise<void>;

  /**
   * Count addresses for a user.
   */
  countByUserId(userId: string): Promise<number>;
}
