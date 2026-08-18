import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { asc, eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../database/database-connection';
import type { DrizzleDatabase } from '../database/merged-schemas';
import {
  toPublicUser,
  users,
  type User,
  type UserRole,
} from '../database/schemas/users';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: DrizzleDatabase,
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('An account with that email already exists.');
    }

    const [created] = await this.database
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        name: data.name,
        password: await hash(data.password, 10),
        affiliation: data.affiliation,
        country: data.country,
        phone: data.phone,
      })
      .returning();

    return created;
  }

  async findOrCreateOAuthUser(data: {
    email: string;
    name: string;
  }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) return existing;

    const [created] = await this.database
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        name: data.name,
        emailVerified: true,
      })
      .returning();

    return created;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return user;
  }

  async findById(id: number): Promise<User> {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setRefreshToken(userId: number, hashedToken: string | null) {
    await this.database
      .update(users)
      .set({ refreshToken: hashedToken, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async markEmailVerified(userId: number) {
    await this.database
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async setPassword(userId: number, plainPassword: string) {
    await this.database
      .update(users)
      .set({
        password: await hash(plainPassword, 10),
        refreshToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateProfile(userId: number, data: UpdateProfileDto) {
    const [updated] = await this.database
      .update(users)
      .set({
        name: data.name,
        title: data.title ?? null,
        affiliation: data.affiliation ?? null,
        country: data.country ?? null,
        phone: data.phone ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return toPublicUser(updated);
  }

  async listUsers() {
    const rows = await this.database
      .select()
      .from(users)
      .orderBy(asc(users.name));
    return rows.map(toPublicUser);
  }

  async setRole(userId: number, role: UserRole) {
    const [updated] = await this.database
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) throw new NotFoundException('User not found');
    return toPublicUser(updated);
  }
}
