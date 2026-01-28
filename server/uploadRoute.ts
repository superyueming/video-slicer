import express from 'express';
import multer from 'multer';
import { storagePut } from './storage';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';

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
    
    // 生成S3存储键
    const timestamp = Date.now();
    const randomId = nanoid(10);
    const filename = file.originalname;
    const fileKey = `videos/${userId}/${timestamp}-${randomId}-${filename}`;
    
    // 上传到S3
    const { url } = await storagePut(fileKey, fileBuffer, file.mimetype);
    
    // 删除临时文件
    await fs.unlink(file.path);
    
    // 返回结果
    res.json({
      success: true,
      fileKey,
      url,
      filename: file.originalname,
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
