const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

class FileProcessor {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.uploadDir = path.join(__dirname, '../uploads');
    this.processedDir = path.join(__dirname, '../processed');

    // Supported file formats
    this.supportedFormats = {
      images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'],
      documents: ['pdf', 'docx', 'doc', 'txt', 'rtf'],
      audio: ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'flac'],
      video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
    };

    this.maxFileSize = 50 * 1024 * 1024; // 50MB

    // Create directories if they don't exist
    [this.uploadDir, this.processedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Configure multer for file uploads
  configureMulter() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().substring(1);
      const allSupportedFormats = [
        ...this.supportedFormats.images,
        ...this.supportedFormats.documents,
        ...this.supportedFormats.audio,
        ...this.supportedFormats.video
      ];

      if (allSupportedFormats.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file format. Supported: ${allSupportedFormats.join(', ')}`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  // Process image files
  async processImage(filePath, options = {}) {
    try {
      console.log(`🖼️ Processing image: ${path.basename(filePath)}`);

      const {
        resize = false,
        width = 800,
        height = 600,
        quality = 80,
        format = 'jpeg'
      } = options;

      let processedImage = sharp(filePath);

      // Resize if requested
      if (resize) {
        processedImage = processedImage.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert format and set quality
      processedImage = processedImage[format]({ quality });

      // Generate output filename
      const outputPath = path.join(
        this.processedDir,
        `${path.basename(filePath, path.extname(filePath))}-processed.${format}`
      );

      await processedImage.toFile(outputPath);

      // Get image metadata
      const metadata = await sharp(filePath).metadata();

      return {
        success: true,
        originalPath: filePath,
        processedPath: outputPath,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size,
          channels: metadata.channels
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Image processing error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Extract text from images using OCR
  async extractTextFromImage(filePath, options = {}) {
    try {
      console.log(`📝 Extracting text from image: ${path.basename(filePath)}`);

      const {
        language = 'en',
        prompt = 'Extract all text from this image accurately'
      } = options;

      // Convert image to base64
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an OCR expert. Extract all text from images accurately, preserving formatting and structure.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      const extractedText = response.choices[0].message.content;

      return {
        success: true,
        text: extractedText,
        language,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ OCR error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Analyze image content
  async analyzeImage(filePath, options = {}) {
    try {
      console.log(`🔍 Analyzing image: ${path.basename(filePath)}`);

      const {
        analysisType = 'general',
        prompt = 'Analyze this image and provide detailed description'
      } = options;

      // Convert image to base64
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');

      const systemPrompt = analysisType === 'general'
        ? 'You are an expert image analyst. Provide detailed analysis of images including objects, people, actions, setting, and context.'
        : `You are an expert ${analysisType} analyst. Analyze this image specifically for ${analysisType} related information.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const analysis = response.choices[0].message.content;

      return {
        success: true,
        analysis,
        analysisType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Image analysis error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Process document files
  async processDocument(filePath, options = {}) {
    try {
      console.log(`📄 Processing document: ${path.basename(filePath)}`);

      const ext = path.extname(filePath).toLowerCase();
      let text = '';

      switch (ext) {
        case '.pdf':
          const pdfBuffer = fs.readFileSync(filePath);
          const pdfData = await pdf(pdfBuffer);
          text = pdfData.text;
          break;

        case '.docx':
          const docxBuffer = fs.readFileSync(filePath);
          const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
          text = docxResult.value;
          break;

        case '.doc':
          // For .doc files, we'll need a different library
          text = 'DOC file processing not implemented yet';
          break;

        case '.txt':
        case '.rtf':
          text = fs.readFileSync(filePath, 'utf8');
          break;

        default:
          throw new Error(`Unsupported document format: ${ext}`);
      }

      return {
        success: true,
        text,
        format: ext.substring(1),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Document processing error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Extract and analyze document content
  async analyzeDocument(filePath, options = {}) {
    try {
      console.log(`📊 Analyzing document: ${path.basename(filePath)}`);

      // First extract text from document
      const extractionResult = await this.processDocument(filePath, options);

      if (!extractionResult.success) {
        return extractionResult;
      }

      const {
        analysisType = 'general',
        prompt = 'Analyze this document and provide a comprehensive summary with key points'
      } = options;

      const systemPrompt = analysisType === 'general'
        ? 'You are an expert document analyst. Provide comprehensive analysis including summary, key points, and insights.'
        : `You are an expert ${analysisType} analyst. Analyze this document specifically for ${analysisType} related information.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `${prompt}\n\nDocument content:\n${extractionResult.text}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      const analysis = response.choices[0].message.content;

      return {
        success: true,
        originalText: extractionResult.text,
        analysis,
        analysisType,
        format: extractionResult.format,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Document analysis error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Batch process multiple files
  async batchProcess(files, options = {}) {
    try {
      console.log(`📦 Batch processing ${files.length} files`);

      const results = [];
      const batchSize = 3; // Process 3 files at a time

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchPromises = batch.map(file => this.processFile(file, options));

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid rate limits
        if (i + batchSize < files.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return {
        success: true,
        results,
        totalFiles: files.length,
        successfulProcessing: results.filter(r => r.success).length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Batch processing error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Process any file type
  async processFile(filePath, options = {}) {
    try {
      const ext = path.extname(filePath).toLowerCase().substring(1);

      if (this.supportedFormats.images.includes(ext)) {
        return await this.processImage(filePath, options);
      } else if (this.supportedFormats.documents.includes(ext)) {
        return await this.processDocument(filePath, options);
      } else {
        return {
          success: false,
          error: `Unsupported file type: ${ext}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('❌ File processing error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clean up processed files
  async cleanupFiles(filePaths) {
    try {
      const cleanupPromises = filePaths.map(filePath => {
        return new Promise((resolve) => {
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`❌ Error deleting file ${filePath}:`, err);
              } else {
                console.log(`🗑️ Deleted file: ${path.basename(filePath)}`);
              }
              resolve();
            });
          } else {
            resolve();
          }
        });
      });

      await Promise.all(cleanupPromises);
      return { success: true, message: 'Files cleaned up successfully' };
    } catch (error) {
      console.error('❌ File cleanup error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get processing statistics
  getProcessingStats() {
    return {
      supportedFormats: this.supportedFormats,
      maxFileSize: this.maxFileSize,
      uploadDirectory: this.uploadDir,
      processedDirectory: this.processedDir
    };
  }

  // Validate file
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file format
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    const allSupportedFormats = [
      ...this.supportedFormats.images,
      ...this.supportedFormats.documents,
      ...this.supportedFormats.audio,
      ...this.supportedFormats.video
    ];

    if (!allSupportedFormats.includes(ext)) {
      errors.push(`Unsupported file format. Supported formats: ${allSupportedFormats.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
const fileProcessor = new FileProcessor();

module.exports = fileProcessor;
