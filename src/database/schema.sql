PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS "t_project";
DROP TABLE IF EXISTS "t_doc_group";
DROP TABLE IF EXISTS "t_doc";
DROP TABLE IF EXISTS "t_capture_group";
DROP TABLE IF EXISTS "t_capture_img";
DROP TABLE IF EXISTS "t_used_capture_img";

CREATE TABLE t_project (
  "id" INTEGER PRIMARY KEY,
  "name" TEXT,
  "description" TEXT,
  "status" TEXT,
  "serv_url" TEXT,
  "delete_yn" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT
);

CREATE TABLE "t_doc_group" (
  "id" INTEGER PRIMARY KEY,
  "name" TEXT,
  "sort_order" INTEGER,
  "latest_src_url" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  "project_id" INTEGER,
  FOREIGN KEY ("project_id") REFERENCES "t_project" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE "t_doc" (
  "id" INTEGER PRIMARY KEY,
  "title" TEXT,
  "description" TEXT,
  "doc_meta_json" TEXT,
  "content_json" TEXT,
  "annotation_json" TEXT,
  "draw_img_src" TEXT,
  "orgn_img_src" TEXT,
  "sort_order" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  "group_id" INTEGER,
  FOREIGN KEY ("group_id") REFERENCES "t_doc_group" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE "t_capture_group" (
  "id" INTEGER PRIMARY KEY,
  "name" TEXT,
  "sort_order" INTEGER,
  "latest_src_url" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  "project_id" INTEGER,
  FOREIGN KEY ("project_id") REFERENCES "t_project" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE "t_capture_img" (
  "id" INTEGER PRIMARY KEY,
  "group_id" INTEGER,
  "img_path" TEXT,
  "created_at" TEXT,
  FOREIGN KEY ("group_id") REFERENCES "t_capture_group" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE "t_used_capture_img" (
  "capture_img_id" INTEGER,
  "doc_id" INTEGER,
  FOREIGN KEY ("capture_img_id") REFERENCES "t_capture_img" ("id") DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY ("doc_id") REFERENCES "t_doc" ("id") DEFERRABLE INITIALLY DEFERRED
);
