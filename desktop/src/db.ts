import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

// 数据库文件路径（存储在用户数据目录）
const dbPath = path.join(app.getPath('userData'), 'video-slicer.db');

// 确保数据目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath);

// 启用WAL模式以提高并发性能
db.pragma('journal_mode = WAL');

// 创建任务表
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL DEFAULT 'pending',
    step TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    videoPath TEXT,
    videoFilename TEXT,
    userRequirement TEXT,
    asrMethod TEXT DEFAULT 'whisper',
    audioPath TEXT,
    transcriptPath TEXT,
    analysisResult TEXT,
    outputPath TEXT,
    errorMessage TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )
`);

// 任务接口
export interface Task {
  id?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  step: string;
  progress?: number;
  videoPath?: string;
  videoFilename?: string;
  userRequirement?: string;
  asrMethod?: 'whisper' | 'aliyun';
  audioPath?: string;
  transcriptPath?: string;
  analysisResult?: string;
  outputPath?: string;
  errorMessage?: string;
  createdAt?: number;
  updatedAt?: number;
}

// 创建任务
export function createTask(task: Partial<Task>): Task {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO tasks (
      status, step, progress, videoPath, videoFilename, userRequirement, asrMethod,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    task.status || 'pending',
    task.step || 'pending',
    task.progress || 0,
    task.videoPath || null,
    task.videoFilename || null,
    task.userRequirement || null,
    task.asrMethod || 'whisper',
    now,
    now
  );
  
  return {
    id: result.lastInsertRowid as number,
    ...task,
    createdAt: now,
    updatedAt: now
  } as Task;
}

// 获取所有任务
export function getAllTasks(): Task[] {
  const stmt = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC');
  return stmt.all() as Task[];
}

// 获取单个任务
export function getTask(id: number): Task | undefined {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return stmt.get(id) as Task | undefined;
}

// 更新任务
export function updateTask(id: number, updates: Partial<Task>): void {
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'createdAt') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) return;
  
  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);
  
  const stmt = db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

// 删除任务
export function deleteTask(id: number): void {
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(id);
}

// 导出数据库实例（用于关闭连接）
export { db };

console.log('[DB] Database initialized at:', dbPath);
