import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../infrastructure/persistence/entities/user.entity';
import { AddressEntity } from '../infrastructure/persistence/entities/address.entity';
import { UserPreferencesEntity } from '../infrastructure/persistence/entities/user-preferences.entity';
import { WishlistItemEntity } from '../infrastructure/persistence/entities/wishlist-item.entity';
import { UserRepository } from '../infrastructure/repositories/user.repository';
import { AddressRepository } from '../infrastructure/repositories/address.repository';
import { UserPreferencesRepository } from '../infrastructure/repositories/user-preferences.repository';
import { WishlistRepository } from '../infrastructure/repositories/wishlist.repository';
import { UserService } from './services/user.service';
import { AddressService } from './services/address.service';
import { PreferencesService } from './services/preferences.service';
import { WishlistService } from './services/wishlist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      AddressEntity,
      UserPreferencesEntity,
      WishlistItemEntity,
    ]),
  ],
  providers: [
    UserRepository,
    AddressRepository,
    UserPreferencesRepository,
    WishlistRepository,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IAddressRepository',
      useClass: AddressRepository,
    },
    {
      provide: 'IUserPreferencesRepository',
      useClass: UserPreferencesRepository,
    },
    {
      provide: 'IWishlistRepository',
      useClass: WishlistRepository,
    },
    UserService,
    AddressService,
    PreferencesService,
    WishlistService,
  ],
  exports: [
    UserService,
    AddressService,
    PreferencesService,
    WishlistService,
  ],
})
export class UserModule {}
