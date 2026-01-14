import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../../application/services/user.service';

@Controller()
export class UserGrpcController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: any) {
    // Create user profile (name combines first_name and last_name)
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    const user = await this.userService.createUser(data.email, fullName);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        password: '', // Not stored in user-service
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        created_at: { seconds: Math.floor(user.createdAt.getTime() / 1000), nanos: 0 },
        updated_at: { seconds: Math.floor(user.updatedAt.getTime() / 1000), nanos: 0 },
      },
    };
  }

  @GrpcMethod('UserService', 'GetByEmail')
  async getByEmail(data: any) {
    // We need to add getByEmail to UserService
    // For now, return an error
    throw new Error('GetByEmail not yet implemented - auth should check auth.users table directly');
  }

  @GrpcMethod('UserService', 'GetProfile')
  async getProfile(data: any) {
    const profile = await this.userService.getProfile(data.user_id);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      profile: {
        id: profile.id,
        email: profile.email || '',
        name: profile.name || '',
        phone: profile.phone || '',
        avatar: profile.avatar || '',
        created_at: profile.createdAt ? { seconds: Math.floor(profile.createdAt.getTime() / 1000), nanos: 0 } : null,
        updated_at: profile.updatedAt ? { seconds: Math.floor(profile.updatedAt.getTime() / 1000), nanos: 0 } : null,
      },
    };
  }

  @GrpcMethod('UserService', 'UpdateProfile')
  async updateProfile(data: any) {
    const profile = await this.userService.updateProfile({
      userId: data.user_id,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
    });

    return {
      profile: {
        id: profile.id,
        email: profile.email || '',
        name: profile.name || '',
        phone: profile.phone || '',
        avatar: profile.avatar || '',
        created_at: profile.createdAt ? { seconds: Math.floor(profile.createdAt.getTime() / 1000), nanos: 0 } : null,
        updated_at: profile.updatedAt ? { seconds: Math.floor(profile.updatedAt.getTime() / 1000), nanos: 0 } : null,
      },
    };
  }
}
