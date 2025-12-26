import { eq, and } from 'drizzle-orm';
import db from '../db';
import { recordingsTable } from '../db/schema/recordings';

export const recordingsController = {
  /**
   * Get all recordings (excluding soft-deleted)
   */
  getAll: async () => {
    const recordings = await db
      .select()
      .from(recordingsTable)
      .where(eq(recordingsTable.deleted_at, null as any));
    return recordings;
  },

  /**
   * Get recordings by user ID
   */
  getByUserId: async (userId: string) => {
    const recordings = await db
      .select()
      .from(recordingsTable)
      .where(
        and(
          eq(recordingsTable.user_id, parseInt(userId)),
          eq(recordingsTable.deleted_at, null as any)
        )
      );
    return recordings;
  },

  /**
   * Get a single recording by ID
   */
  getById: async (id: string) => {
    const recording = await db
      .select()
      .from(recordingsTable)
      .where(
        and(
          eq(recordingsTable.id, parseInt(id)),
          eq(recordingsTable.deleted_at, null as any)
        )
      )
      .limit(1);

    return recording[0] || null;
  },

  /**
   * Create a new recording
   */
  create: async (data: {
    name: string;
    transcript: string;
    geolocation: string;
    user_id: number;
  }) => {
    const [recording] = await db
      .insert(recordingsTable)
      .values({
        name: data.name,
        transcript: data.transcript,
        geolocation: data.geolocation,
        user_id: data.user_id,
      })
      .returning();

    return recording;
  },

  /**
   * Update an existing recording
   */
  update: async (
    id: string,
    data: {
      name?: string;
      transcript?: string;
      geolocation?: string;
      user_id?: number;
    }
  ) => {
    const [recording] = await db
      .update(recordingsTable)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(recordingsTable.id, parseInt(id)))
      .returning();

    return recording || null;
  },

  /**
   * Soft delete a recording
   */
  delete: async (id: string) => {
    const [recording] = await db
      .update(recordingsTable)
      .set({ deleted_at: new Date() })
      .where(eq(recordingsTable.id, parseInt(id)))
      .returning();

    return recording || null;
  },
};
