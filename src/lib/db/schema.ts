import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  title: text("title"),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt,
  updatedAt,
});

export const grants = pgTable(
  "grants",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    level: integer("level").default(1).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.key] })],
);

export const people = pgTable("people", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nation: text("nation").notNull(),
  office: text("office").notNull(),
  summary: text("summary").notNull().default(""),
  notes: text("notes").notNull().default(""),
  portraitKey: text("portrait_key"),
  featured: boolean("featured").default(false).notNull(),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt,
  updatedAt,
});

export const citizens = pgTable("citizens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .unique()
    .references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  epithet: text("epithet").notNull().default(""),
  grade: text("grade").notNull().default(""),
  status: text("status").notNull().default("actif"),
  joinedOn: date("joined_on"),
  notes: text("notes").notNull().default(""),
  portraitKey: text("portrait_key"),
  createdAt,
  updatedAt,
});

export const offices = pgTable("offices", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id"),
  citizenId: text("citizen_id").references(() => citizens.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt,
  updatedAt,
});

export const shelves = pgTable("shelves", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  sensitivity: text("sensitivity").notNull().default("ouvert"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt,
  updatedAt,
});

export const books = pgTable(
  "books",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    shelfId: text("shelf_id")
      .notNull()
      .references(() => shelves.id, { onDelete: "restrict" }),
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    summary: text("summary").notNull().default(""),
    status: text("status").notNull().default("draft"),
    level: integer("level").default(1).notNull(),
    occurredOn: date("occurred_on"),
    coverKey: text("cover_key"),
    createdAt,
    updatedAt,
  },
  (table) => [index("books_shelf_idx").on(table.shelfId)],
);

export const chapters = pgTable(
  "chapters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bookId: text("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [index("chapters_book_idx").on(table.bookId)],
);

export const decrees = pgTable("decrees", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  reference: text("reference"),
  title: text("title").notNull(),
  preamble: text("preamble").notNull().default(""),
  body: text("body").notNull().default(""),
  status: text("status").notNull().default("draft"),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  repealedAt: timestamp("repealed_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const parchments = pgTable("parchments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  pinned: boolean("pinned").default(false).notNull(),
  status: text("status").notNull().default("published"),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt,
  updatedAt,
});

export const letters = pgTable("letters", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  body: text("body").notNull().default(""),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const assets = pgTable("assets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  mime: text("mime").notNull(),
  shelfId: text("shelf_id").references(() => shelves.id, { onDelete: "set null" }),
  uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt,
});

export const usersRelations = relations(users, ({ many }) => ({
  grants: many(grants),
}));

export const grantsRelations = relations(grants, ({ one }) => ({
  user: one(users, { fields: [grants.userId], references: [users.id] }),
}));

export const shelvesRelations = relations(shelves, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  shelf: one(shelves, { fields: [books.shelfId], references: [shelves.id] }),
  author: one(users, { fields: [books.authorId], references: [users.id] }),
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one }) => ({
  book: one(books, { fields: [chapters.bookId], references: [books.id] }),
}));

export const lettersRelations = relations(letters, ({ one }) => ({
  author: one(users, { fields: [letters.authorId], references: [users.id] }),
}));

export const citizensRelations = relations(citizens, ({ one }) => ({
  account: one(users, { fields: [citizens.userId], references: [users.id] }),
}));

export const officesRelations = relations(offices, ({ one, many }) => ({
  citizen: one(citizens, { fields: [offices.citizenId], references: [citizens.id] }),
  parent: one(offices, { fields: [offices.parentId], references: [offices.id], relationName: "officeTree" }),
  children: many(offices, { relationName: "officeTree" }),
}));
