import express from 'express';
import { uploadProfile, uploadDocument, deleteImage, getPublicIdFromUrl } from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';

const uploadRouter = express.Router();

/**
 * POST /upload/profile
 * Upload profile picture
 */
uploadRouter.post('/profile', protect, uploadProfile.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      url: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    console.error('Profile upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading profile picture',
    });
  }
});

/**
 * POST /upload/document
 * Upload document
 */
uploadRouter.post('/document', protect, uploadDocument.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading document',
    });
  }
});

/**
 * DELETE /upload
 * Delete uploaded file
 */
uploadRouter.delete('/', protect, async (req, res) => {
  try {
    const { url, publicId } = req.body;

    const idToDelete = publicId || getPublicIdFromUrl(url);

    if (!idToDelete) {
      return res.status(400).json({
        success: false,
        message: 'No valid file identifier provided',
      });
    }

    await deleteImage(idToDelete);

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting file',
    });
  }
});

export default uploadRouter;
