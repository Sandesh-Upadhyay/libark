/**
 * 👤 User Factory
 *
 * Factory for creating test users with authentication support.
 * Auto-generates unique usernames and emails.
 */

import type { Prisma, User } from '@libark/db';
import { hashPassword } from '@libark/core-server/security/password';
import { BaseFactory, FactoryOptions } from './BaseFactory';

export interface UserOverride {
  email?: string;
  username?: string;
  passwordHash?: string;
  displayName?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  bio?: string | null;
}

export class UserFactory extends BaseFactory<User, Prisma.UserCreateInput, UserOverride> {
  protected async generateDefaults(): Promise<Omit<Prisma.UserCreateInput, 'id'>> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);

    return {
      email: `test_user_${timestamp}_${random}@test.com`,
      username: `testuser_${timestamp}_${random}`,
      passwordHash: await hashPassword('TestPassword123!'),
      displayName: `Test User ${random}`,
      isActive: true,
      isVerified: true,
      bio: null,
    };
  }

  protected async persist(
    data: Prisma.UserCreateInput,
    tx: Prisma.TransactionClient
  ): Promise<User> {
    return tx.user.create({
      data,
    });
  }

  /**
   * Create a user with specific password (for authentication tests)
   */
  async createWithPassword(
    password: string,
    override: Omit<UserOverride, 'passwordHash'> = {},
    options: FactoryOptions = {}
  ): Promise<User & { plainPassword: string }> {
    const passwordHash = await hashPassword(password);

    const user = await this.create(
      {
        ...override,
        passwordHash,
      },
      options
    );

    return { ...user, plainPassword: password };
  }

  /**
   * Create an admin user with ADMIN permission
   */
  async createAdmin(
    override: UserOverride = {},
    options: FactoryOptions = {}
  ): Promise<{ user: User; permissionId: string }> {
    const user = await this.create(override, options);

    if (options.tx) {
      const permission = await options.tx.permission.create({
        data: {
          name: `ADMIN_${this.generateUnique('')}`,
          description: 'Administrator permission',
        },
      });

      await options.tx.userPermissionOverride.create({
        data: {
          userId: user.id,
          permissionId: permission.id,
          allowed: true,
          isActive: true,
        },
      });

      return { user, permissionId: permission.id };
    }

    return this.prisma.$transaction(async tx => {
      const permission = await tx.permission.create({
        data: {
          name: `ADMIN_${this.generateUnique('')}`,
          description: 'Administrator permission',
        },
      });

      await tx.userPermissionOverride.create({
        data: {
          userId: user.id,
          permissionId: permission.id,
          allowed: true,
          isActive: true,
        },
      });

      return { user, permissionId: permission.id };
    });
  }

  /**
   * Create an unverified user
   */
  async createUnverified(override: UserOverride = {}, options: FactoryOptions = {}): Promise<User> {
    return this.create(
      {
        ...override,
        isVerified: false,
      },
      options
    );
  }

  /**
   * Create an inactive user
   */
  async createInactive(override: UserOverride = {}, options: FactoryOptions = {}): Promise<User> {
    return this.create(
      {
        ...override,
        isActive: false,
      },
      options
    );
  }
}
