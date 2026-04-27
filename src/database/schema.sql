PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS "t_doc";
DROP TABLE IF EXISTS "t_capture";
DROP TABLE IF EXISTS "t_workspace";
DROP TABLE IF EXISTS "t_project";

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
  FOREIGN KEY ("project_id") REFERENCES "t_project" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE "t_capture" (
  "id" INTEGER PRIMARY KEY,
  "workspace_id" INTEGER,
  "name" TEXT,
  "img_path" TEXT,
  "created_at" TEXT,
  FOREIGN KEY ("workspace_id") REFERENCES "t_workspace" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE "t_doc" (
  "id" INTEGER PRIMARY KEY,
  "workspace_id" INTEGER,
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
  FOREIGN KEY ("workspace_id") REFERENCES "t_workspace" ("id") DEFERRABLE INITIALLY DEFERRED
);
