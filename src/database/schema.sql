PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS "t_section_doc";
DROP TABLE IF EXISTS "t_section";
DROP TABLE IF EXISTS "t_deliverable";
DROP TABLE IF EXISTS "t_doc";
DROP TABLE IF EXISTS "t_capture";
DROP TABLE IF EXISTS "t_workspace";
DROP TABLE IF EXISTS "t_project";

PRAGMA foreign_keys = ON;

CREATE TABLE "t_project" (
  "id" INTEGER PRIMARY KEY,
  "name" TEXT,
  "description" TEXT,
  "serv_url" TEXT,
  "status" TEXT,
  "thumbnail_path" TEXT,
  "delete_yn" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT
);

CREATE TABLE "t_workspace" (
  "id" INTEGER PRIMARY KEY,
  "project_id" INTEGER,
  "name" TEXT,
  "latest_src_url" TEXT,
  "thumbnail_path" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("project_id") REFERENCES "t_project" ("id") ON DELETE CASCADE
);

CREATE TABLE "t_capture" (
  "id" INTEGER PRIMARY KEY,
  "workspace_id" INTEGER,
  "name" TEXT,
  "img_path" TEXT,
  "created_at" TEXT,
  FOREIGN KEY ("workspace_id") REFERENCES "t_workspace" ("id") ON DELETE CASCADE
);

CREATE TABLE "t_doc" (
  "id" INTEGER PRIMARY KEY,
  "workspace_id" INTEGER,
  "section_id" INTEGER,
  "title" TEXT,
  "description" TEXT,
  "status" TEXT,
  "doc_meta_json" TEXT,
  "content_json" TEXT,
  "annotation_json" TEXT,
  "orgn_img_path" TEXT,
  "draw_img_path" TEXT,
  "sort_order" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("workspace_id") REFERENCES "t_workspace" ("id") ON DELETE CASCADE
);

CREATE TABLE "t_deliverable" (
  "id" INTEGER PRIMARY KEY,
  "project_id" INTEGER,
  "title" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("project_id") REFERENCES "t_project" ("id") ON DELETE CASCADE
);

CREATE TABLE "t_section" (
  "id" INTEGER PRIMARY KEY,
  "deliverable_id" INTEGER,
  "parent_id" INTEGER,
  "name" TEXT,
  "sort_order" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("deliverable_id") REFERENCES "t_deliverable" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("parent_id") REFERENCES "t_section" ("id") ON DELETE CASCADE
);

CREATE TABLE "t_section_doc" (
  "id" INTEGER PRIMARY KEY,
  "section_id" INTEGER,
  "doc_id" INTEGER,
  "sort_order" INTEGER,
  "created_at" TEXT,
  FOREIGN KEY ("section_id") REFERENCES "t_section" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("doc_id") REFERENCES "t_doc" ("id") ON DELETE CASCADE
);

CREATE INDEX "idx_workspace_project_id" ON "t_workspace" ("project_id");
CREATE INDEX "idx_capture_workspace_id" ON "t_capture" ("workspace_id");
CREATE INDEX "idx_doc_workspace_id" ON "t_doc" ("workspace_id");
CREATE INDEX "idx_deliverable_project_id" ON "t_deliverable" ("project_id");
CREATE INDEX "idx_section_deliverable_id" ON "t_section" ("deliverable_id");
CREATE INDEX "idx_section_parent_id" ON "t_section" ("parent_id");
CREATE INDEX "idx_section_doc_section_id" ON "t_section_doc" ("section_id");
CREATE INDEX "idx_section_doc_doc_id" ON "t_section_doc" ("doc_id");
