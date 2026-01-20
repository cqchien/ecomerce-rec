import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { User } from '../../domain/models/user.model';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { CACHE_KEY_USER, USER_CACHE_TTL } from '../../common/constants';
import { ICacheService } from '../../domain/interfaces/cache.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) {}

  /**
   * Get user profile by ID
   * @param userId The user ID
   * @return User profile
   */
  async getProfile(userId: string): Promise<User> {
    const cacheKey = `${CACHE_KEY_USER}${userId}`;
    const cached = await this.cacheService.get<User>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    await this.cacheService.set(cacheKey, user, USER_CACHE_TTL);

    return user;
  }

  /**
   * Update user profile information
   * @param dto Update profile data transfer object
   * @return Updated user profile
   */
  async updateProfile(dto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findById(dto.userId);

    if (!user) {
      throw new NotFoundException(`User not found: ${dto.userId}`);
    }

    user.updateProfile({
      name: dto.name,
      phone: dto.phone,
      avatar: dto.avatar,
    });

    const updatedUser = await this.userRepository.save(user);

    const cacheKey = `${CACHE_KEY_USER}${dto.userId}`;
    await this.cacheService.del(cacheKey);

    return updatedUser;
  }

  /**
   * Create a new user
   * @param email User email address
   * @param name User name
   * @return Created user
   */
  async createUser(email: string, name: string): Promise<User> {
    const user = new User({
      email,
      name,
      phone: null,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    return this.userRepository.save(user);
  }

  /**
   * Delete user account (soft delete)
   * @param userId The user ID
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    await this.userRepository.softDelete(userId);

    const cacheKey = `${CACHE_KEY_USER}${userId}`;
    await this.cacheService.del(cacheKey);
  }
}
