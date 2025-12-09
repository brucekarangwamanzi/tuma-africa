const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../middleware/auth');
const { validateFileUpload } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Cloudinary configuration (optional)
let cloudinary = null;
if (process.env.USE_CLOUDINARY === 'true') {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  } catch (error) {
    console.warn('Cloudinary not configured properly, using local storage');
  }
}

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload and optimize image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     parameters:
 *       - in: query
 *         name: maxWidth
 *         schema:
 *           type: integer
 *           default: 800
 *       - in: query
 *         name: maxHeight
 *         schema:
 *           type: integer
 *           default: 600
 *       - in: query
 *         name: quality
 *         schema:
 *           type: integer
 *           default: 80
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 imageUrl:
 *                   type: string
 */
// @route   POST /api/upload/image
// @desc    Upload and optimize image
// @access  Private
router.post('/image', authenticateToken, upload.single('image'), validateFileUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const { maxWidth = 800, maxHeight = 600, quality = 80 } = req.query;
    
    // Optimize image with Sharp
    const optimizedPath = req.file.path.replace(path.extname(req.file.path), '-optimized.webp');
    
    await sharp(req.file.path)
      .resize(parseInt(maxWidth), parseInt(maxHeight), {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: parseInt(quality) })
      .toFile(optimizedPath);

    // Remove original file
    await fs.unlink(req.file.path);

    let imageUrl = `/uploads/${path.basename(optimizedPath)}`;

    // Upload to Cloudinary if configured
    if (cloudinary) {
      try {
        const result = await cloudinary.uploader.upload(optimizedPath, {
          folder: 'tuma-africa-cargo',
          resource_type: 'image'
        });
        imageUrl = result.secure_url;
        
        // Remove local file after Cloudinary upload
        await fs.unlink(optimizedPath);
      } catch (cloudinaryError) {
        console.warn('Cloudinary upload failed, using local file:', cloudinaryError.message);
      }
    }

    res.json({
      message: 'Image uploaded successfully',
      imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error('Image upload error:', error);
    
    // Clean up files on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/upload/video
// @desc    Upload video file
// @access  Private
router.post('/video', authenticateToken, upload.single('video'), validateFileUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Check file size (15MB limit for videos)
    if (req.file.size > 15 * 1024 * 1024) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'Video file too large. Maximum size is 15MB.' });
    }

    let videoUrl = `/uploads/${req.file.filename}`;

    // Upload to Cloudinary if configured
    if (cloudinary) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'tuma-africa-cargo',
          resource_type: 'video'
        });
        videoUrl = result.secure_url;
        
        // Remove local file after Cloudinary upload
        await fs.unlink(req.file.path);
      } catch (cloudinaryError) {
        console.warn('Cloudinary upload failed, using local file:', cloudinaryError.message);
      }
    }

    res.json({
      message: 'Video uploaded successfully',
      videoUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error('Video upload error:', error);
    
    // Clean up files on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: 'Failed to upload video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/upload/document
// @desc    Upload document file
// @access  Private
router.post('/document', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document file uploaded' });
    }

    let documentUrl = `/uploads/${req.file.filename}`;

    // Upload to Cloudinary if configured
    if (cloudinary) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'tuma-africa-cargo/documents',
          resource_type: 'raw'
        });
        documentUrl = result.secure_url;
        
        // Remove local file after Cloudinary upload
        await fs.unlink(req.file.path);
      } catch (cloudinaryError) {
        console.warn('Cloudinary upload failed, using local file:', cloudinaryError.message);
      }
    }

    res.json({
      message: 'Document uploaded successfully',
      documentUrl,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });

  } catch (error) {
    console.error('Document upload error:', error);
    
    // Clean up files on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: 'Failed to upload document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        let fileUrl = `/uploads/${file.filename}`;

        // Optimize images
        if (file.mimetype.startsWith('image/')) {
          const optimizedPath = file.path.replace(path.extname(file.path), '-optimized.webp');
          
          await sharp(file.path)
            .resize(800, 600, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(optimizedPath);

          await fs.unlink(file.path);
          fileUrl = `/uploads/${path.basename(optimizedPath)}`;
        }

        // Upload to Cloudinary if configured
        if (cloudinary) {
          try {
            const resourceType = file.mimetype.startsWith('video/') ? 'video' : 
                               file.mimetype.startsWith('image/') ? 'image' : 'raw';
            
            const result = await cloudinary.uploader.upload(
              file.mimetype.startsWith('image/') ? optimizedPath : file.path,
              {
                folder: 'tuma-africa-cargo',
                resource_type: resourceType
              }
            );
            
            fileUrl = result.secure_url;
            
            // Remove local file
            const localPath = file.mimetype.startsWith('image/') ? optimizedPath : file.path;
            await fs.unlink(localPath);
          } catch (cloudinaryError) {
            console.warn('Cloudinary upload failed for file:', file.originalname);
          }
        }

        uploadedFiles.push({
          originalName: file.originalname,
          fileUrl,
          size: file.size,
          mimeType: file.mimetype
        });

      } catch (fileError) {
        errors.push({
          file: file.originalname,
          error: fileError.message
        });
        
        // Clean up file on error
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to clean up file:', unlinkError);
        }
      }
    }

    res.json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload files',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/upload/:filename
// @desc    Delete uploaded file
// @access  Private
router.delete('/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file
    await fs.unlink(filePath);

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

module.exports = router;