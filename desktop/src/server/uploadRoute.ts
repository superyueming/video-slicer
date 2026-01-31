import express from 'express';
import multer from 'multer';
import { storagePut } from './storage';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// 配置multer使用临时目录
const upload = multer({
  dest: '/tmp/video-uploads',
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB
  },
});

/**
 * POST /api/upload-video
 * 接收视频文件上传
 */
router.post('/upload-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const file = req.file;
    const userId = (req as any).userId || 'anonymous'; // 从session获取用户ID
    
    console.log('Received file upload:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    });

    // 读取临时文件
    const fileBuffer = await fs.readFile(file.path);
    
    // 生成S3存储键（使用ASCII安全的文件名）
    const timestamp = Date.now();
    const originalFilename = file.originalname;
    
    // 提取文件扩展名，将文件名转换为ASCII安全字符
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    
    // 将文件名转换为ASCII安全字符：只保留字母、数字、连字符和下划线
    let safeBasename = basename
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')  // 非ASCII字符替换为连字符
      .replace(/-+/g, '-')            // 多个连字符合并为一个
      .replace(/^-|-$/g, '');         // 去掉首尾的连字符
    
    // 如果转换后为空（全是中文或特殊字符），使用默认名称
    if (!safeBasename) {
      safeBasename = 'video';
    }
    
    const safeFilename = `${safeBasename}${ext}`;
    const fileKey = `videos/${userId}/${timestamp}-${safeFilename}`;
    
    // 上传到S3
    const { url } = await storagePut(fileKey, fileBuffer, file.mimetype);
    
    // 删除临时文件
    await fs.unlink(file.path);
    
    // 返回结果
    res.json({
      success: true,
      fileKey,
      url,
      filename: safeFilename, // 使用简化后的文件名，与S3键一致
      size: file.size,
      contentType: file.mimetype,
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // 清理临时文件
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error('Failed to cleanup temp file:', e);
      }
    }
    
    res.status(500).json({
      error: '文件上传失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
});

export default router;
