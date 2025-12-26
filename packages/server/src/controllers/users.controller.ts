import { eq, and } from 'drizzle-orm';
import db from '../db';
import { usersTable } from '../db/schema/users';

export const usersController = {
  /**
   * Get all users (excluding soft-deleted)
   */
  getAll: async () => {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.deleted_at, null as any));
    return users;
  },

  /**
   * Get a single user by ID
   */
  getById: async (id: string) => {
    const user = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, parseInt(id)),
          eq(usersTable.deleted_at, null as any)
        )
      )
      .limit(1);

    return user[0] || null;
  },

  /**
   * Create a new user
   */
  create: async (data: {
    name: string;
    email: string;
    password: string;
    avatar: string;
  }) => {
    const [user] = await db
      .insert(usersTable)
      .values({
        name: data.name,
        email: data.email,
        password: data.password,
        avatar: data.avatar,
      })
      .returning();

    return user;
  },

  /**
   * Update an existing user
   */
  update: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      avatar?: string;
    }
  ) => {
    const [user] = await db
      .update(usersTable)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(usersTable.id, parseInt(id)))
      .returning();

    return user || null;
  },

  /**
   * Soft delete a user
   */
  delete: async (id: string) => {
    const [user] = await db
      .update(usersTable)
      .set({ deleted_at: new Date() })
      .where(eq(usersTable.id, parseInt(id)))
      .returning();

    return user || null;
  },
};
