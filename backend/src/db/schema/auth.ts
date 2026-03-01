import { boolean, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import type { AdapterAccountType } from "@auth/core/adapters";

export const accounts = pgTable("auth_accounts", {
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  id_token: text("id_token"),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  scope: text("scope"),
  session_state: text("session_state"),
  token_type: text("token_type"),
  type: text("type").$type<AdapterAccountType>().notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accountsPK = primaryKey({
  columns: [accounts.provider, accounts.providerAccountId],
});

export const sessions = pgTable("auth_sessions", {
  expires: timestamp("expires").notNull(),
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const verificationTokens = pgTable("auth_verification_tokens", {
  expires: timestamp("expires").notNull(),
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
});

export const verificationTokensPK = primaryKey({
  columns: [verificationTokens.identifier, verificationTokens.token],
});

export const authenticators = pgTable("auth_authenticators", {
  counter: integer("counter").notNull(),
  credentialBackedUp: boolean("credentialBackedUp").notNull(),
  credentialDeviceType: text("credentialDeviceType").notNull(),
  credentialID: text("credentialID").notNull().unique(),
  credentialPublicKey: text("credentialPublicKey").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  transports: text("transports"),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const authenticatorsPK = primaryKey({
  columns: [authenticators.userId, authenticators.credentialID],
});
