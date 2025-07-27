const express = require('express');
const router = express.Router();
const fileProcessor = require('../services/fileProcessor');
const path = require('path');
const fs = require('fs'); // Added missing import for fs

// Configure multer for file uploads
const upload = fileProcessor.configureMulter();

// Process single file
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    const filePath = req.file.path;
    const options = {
      resize: req.body.resize === 'true',
      width: parseInt(req.body.width) || 800,
      height: parseInt(req.body.height) || 600,
      quality: parseInt(req.body.quality) || 80,
      format: req.body.format || 'jpeg'
    };

    const result = await fileProcessor.processFile(filePath, options);

    // Clean up uploaded file
    await fileProcessor.cleanupFiles([filePath]);

    if (result.success) {
      res.json({
        success: true,
        result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process file'
    });
  }
});

// Extract text from image (OCR)
router.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const filePath = req.file.path;
    const options = {
      language: req.body.language || 'en',
      prompt: req.body.prompt || 'Extract all text from this image accurately'
    };

    const result = await fileProcessor.extractTextFromImage(filePath, options);

    // Clean up uploaded file
    await fileProcessor.cleanupFiles([filePath]);

    if (result.success) {
      res.json({
        success: true,
        text: result.text,
        language: result.language,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract text from image'
    });
  }
});

// Analyze image content
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const filePath = req.file.path;
    const options = {
      analysisType: req.body.analysisType || 'general',
      prompt: req.body.prompt || 'Analyze this image and provide detailed description'
    };

    const result = await fileProcessor.analyzeImage(filePath, options);

    // Clean up uploaded file
    await fileProcessor.cleanupFiles([filePath]);

    if (result.success) {
      res.json({
        success: true,
        analysis: result.analysis,
        analysisType: result.analysisType,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image'
    });
  }
});

// Process document
router.post('/process-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file provided'
      });
    }

    const filePath = req.file.path;
    const options = {
      analysisType: req.body.analysisType || 'general',
      prompt: req.body.prompt || 'Analyze this document and provide a comprehensive summary with key points'
    };

    const result = await fileProcessor.analyzeDocument(filePath, options);

    // Clean up uploaded file
    await fileProcessor.cleanupFiles([filePath]);

    if (result.success) {
      res.json({
        success: true,
        originalText: result.originalText,
        analysis: result.analysis,
        analysisType: result.analysisType,
        format: result.format,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process document'
    });
  }
});

// Batch process multiple files
router.post('/batch-process', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const filePaths = req.files.map(file => file.path);
    const options = {
      resize: req.body.resize === 'true',
      width: parseInt(req.body.width) || 800,
      height: parseInt(req.body.height) || 600,
      quality: parseInt(req.body.quality) || 80,
      format: req.body.format || 'jpeg'
    };

    const result = await fileProcessor.batchProcess(filePaths, options);

    // Clean up uploaded files
    await fileProcessor.cleanupFiles(filePaths);

    if (result.success) {
      res.json({
        success: true,
        results: result.results,
        totalFiles: result.totalFiles,
        successfulProcessing: result.successfulProcessing,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch process files'
    });
  }
});

// Validate file
router.post('/validate', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    const validation = fileProcessor.validateFile(req.file);

    // Clean up uploaded file
    fileProcessor.cleanupFiles([req.file.path]);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate file'
    });
  }
});

// Get processing statistics
router.get('/stats', (req, res) => {
  try {
    const stats = fileProcessor.getProcessingStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get processing statistics'
    });
  }
});

// Test file processing with sample data
router.post('/test', async (req, res) => {
  try {
    const { fileData, fileType, options = {} } = req.body;

    if (!fileData) {
      return res.status(400).json({
        success: false,
        error: 'No file data provided'
      });
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileData, 'base64');

    // Create temporary file
    const tempPath = path.join(fileProcessor.uploadDir, `test-${Date.now()}.${fileType || 'txt'}`);
    fs.writeFileSync(tempPath, fileBuffer);

    const result = await fileProcessor.processFile(tempPath, options);

    // Clean up temporary file
    await fileProcessor.cleanupFiles([tempPath]);

    if (result.success) {
      res.json({
        success: true,
        result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test file processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test file processing'
    });
  }
});

// Get supported file formats
router.get('/formats', (req, res) => {
  try {
    const stats = fileProcessor.getProcessingStats();

    res.json({
      success: true,
      formats: stats.supportedFormats
    });
  } catch (error) {
    console.error('Get formats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported formats'
    });
  }
});

module.exports = router;
