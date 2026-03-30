PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS annotations;
DROP TABLE IF EXISTS captures;
DROP TABLE IF EXISTS folders;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS app_settings;

PRAGMA foreign_keys = ON;

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  source_url TEXT NOT NULL DEFAULT '',
  progress INTEGER NOT NULL DEFAULT 0
    CHECK (progress BETWEEN 0 AND 100),
  delete_yn TEXT NOT NULL DEFAULT 'N'
    CHECK (delete_yn IN ('Y', 'N')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  area_type TEXT NOT NULL DEFAULT 'capture'
    CHECK (area_type IN ('capture', 'document')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  delete_yn TEXT NOT NULL DEFAULT 'N'
    CHECK (delete_yn IN ('Y', 'N')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE captures (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  page_title TEXT NOT NULL DEFAULT '',
  menu_path TEXT NOT NULL DEFAULT '',
  screen_description TEXT NOT NULL DEFAULT '',
  functionality_description TEXT NOT NULL DEFAULT '',
  writer_name TEXT NOT NULL DEFAULT '',
  page_no INTEGER NOT NULL DEFAULT 1,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_selected INTEGER NOT NULL DEFAULT 0
    CHECK (is_selected IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  capture_id TEXT NOT NULL,
  tool_type TEXT NOT NULL DEFAULT 'number'
    CHECK (tool_type IN ('number', 'box')),
  marker_no INTEGER,
  x REAL NOT NULL CHECK (x BETWEEN 0 AND 1),
  y REAL NOT NULL CHECK (y BETWEEN 0 AND 1),
  width REAL,
  height REAL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (capture_id) REFERENCES captures(id) ON DELETE CASCADE
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_projects_delete_yn
  ON projects(delete_yn);

CREATE INDEX idx_folders_project_id
  ON folders(project_id);

CREATE INDEX idx_folders_project_delete_yn
  ON folders(project_id, delete_yn);

CREATE UNIQUE INDEX uq_folders_project_area_title_active
  ON folders(project_id, area_type, title)
  WHERE delete_yn = 'N';

CREATE INDEX idx_captures_project_folder
  ON captures(project_id, folder_id);

CREATE INDEX idx_captures_selected
  ON captures(project_id, is_selected);

CREATE INDEX idx_captures_image_path
  ON captures(image_path);

CREATE INDEX idx_annotations_capture_id
  ON annotations(capture_id);

CREATE INDEX idx_annotations_capture_tool_type
  ON annotations(capture_id, tool_type);

CREATE UNIQUE INDEX uq_annotations_capture_marker_no
  ON annotations(capture_id, marker_no)
  WHERE marker_no IS NOT NULL;

CREATE TRIGGER trg_projects_updated_at
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
  UPDATE projects
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER trg_folders_updated_at
AFTER UPDATE ON folders
FOR EACH ROW
BEGIN
  UPDATE folders
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER trg_captures_updated_at
AFTER UPDATE ON captures
FOR EACH ROW
BEGIN
  UPDATE captures
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER trg_annotations_updated_at
AFTER UPDATE ON annotations
FOR EACH ROW
BEGIN
  UPDATE annotations
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

PRAGMA user_version = 6;
