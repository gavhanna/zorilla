import { integer, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

const timestamps = {
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
}

export const recordingsTable = pgTable("recordings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  transcript: varchar().notNull(),
  geolocation: varchar().notNull(),
  user_id: integer().notNull(),
  ...timestamps,
});
