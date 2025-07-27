import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFile, FiImage, FiMusic, FiVideo, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const FileUpload = ({ onFileProcessed, onTranscriptionComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processingType, setProcessingType] = useState('');
  const [results, setResults] = useState([]);

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // File type configurations
  const fileTypes = {
    audio: {
      icon: <FiMusic />,
      label: 'Audio Files',
      extensions: ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.flac'],
      accept: 'audio/*'
    },
    image: {
      icon: <FiImage />,
      label: 'Image Files',
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'],
      accept: 'image/*'
    },
    document: {
      icon: <FiFile />,
      label: 'Document Files',
      extensions: ['.pdf', '.docx', '.doc', '.txt', '.rtf'],
      accept: '.pdf,.docx,.doc,.txt,.rtf'
    },
    video: {
      icon: <FiVideo />,
      label: 'Video Files',
      extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      accept: 'video/*'
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  // Process selected files
  const handleFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) selected`);
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Process audio files with Whisper
  const processAudioFiles = async () => {
    setProcessing(true);
    setProcessingType('transcription');

    try {
      const audioFiles = uploadedFiles.filter(file =>
        file.type.startsWith('audio/')
      );

      if (audioFiles.length === 0) {
        toast.error('No audio files found');
        return;
      }

      const formData = new FormData();
      audioFiles.forEach(file => {
        formData.append('audio', file.file);
      });

      const response = await fetch('http://localhost:5000/api/whisper/batch-transcribe', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        const newResults = result.results.map((transcription, index) => ({
          id: Date.now() + index,
          fileName: audioFiles[index].name,
          type: 'transcription',
          content: transcription.text,
          language: transcription.language,
          duration: transcription.duration,
          timestamp: transcription.timestamp
        }));

        setResults(prev => [...prev, ...newResults]);
        onTranscriptionComplete?.(newResults);
        toast.success(`Transcribed ${result.successfulTranscriptions} audio files`);
      } else {
        toast.error('Transcription failed');
      }
    } catch (error) {
      console.error('Audio processing error:', error);
      toast.error('Failed to process audio files');
    } finally {
      setProcessing(false);
      setProcessingType('');
    }
  };

  // Process image files
  const processImageFiles = async () => {
    setProcessing(true);
    setProcessingType('image-analysis');

    try {
      const imageFiles = uploadedFiles.filter(file =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) {
        toast.error('No image files found');
        return;
      }

      const results = [];

      for (const imageFile of imageFiles) {
        const formData = new FormData();
        formData.append('image', imageFile.file);

        const response = await fetch('http://localhost:5000/api/files/analyze-image', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          results.push({
            id: Date.now() + Math.random(),
            fileName: imageFile.name,
            type: 'image-analysis',
            content: result.analysis,
            analysisType: result.analysisType,
            timestamp: result.timestamp
          });
        }
      }

      setResults(prev => [...prev, ...results]);
      onFileProcessed?.(results);
      toast.success(`Analyzed ${results.length} image files`);
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error('Failed to process image files');
    } finally {
      setProcessing(false);
      setProcessingType('');
    }
  };

  // Extract text from images (OCR)
  const extractTextFromImages = async () => {
    setProcessing(true);
    setProcessingType('ocr');

    try {
      const imageFiles = uploadedFiles.filter(file =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) {
        toast.error('No image files found');
        return;
      }

      const results = [];

      for (const imageFile of imageFiles) {
        const formData = new FormData();
        formData.append('image', imageFile.file);

        const response = await fetch('http://localhost:5000/api/files/ocr', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          results.push({
            id: Date.now() + Math.random(),
            fileName: imageFile.name,
            type: 'ocr',
            content: result.text,
            language: result.language,
            timestamp: result.timestamp
          });
        }
      }

      setResults(prev => [...prev, ...results]);
      onFileProcessed?.(results);
      toast.success(`Extracted text from ${results.length} images`);
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('Failed to extract text from images');
    } finally {
      setProcessing(false);
      setProcessingType('');
    }
  };

  // Process document files
  const processDocumentFiles = async () => {
    setProcessing(true);
    setProcessingType('document-analysis');

    try {
      const documentFiles = uploadedFiles.filter(file =>
        file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')
      );

      if (documentFiles.length === 0) {
        toast.error('No document files found');
        return;
      }

      const results = [];

      for (const docFile of documentFiles) {
        const formData = new FormData();
        formData.append('document', docFile.file);

        const response = await fetch('http://localhost:5000/api/files/process-document', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          results.push({
            id: Date.now() + Math.random(),
            fileName: docFile.name,
            type: 'document-analysis',
            content: result.analysis,
            originalText: result.originalText,
            format: result.format,
            timestamp: result.timestamp
          });
        }
      }

      setResults(prev => [...prev, ...results]);
      onFileProcessed?.(results);
      toast.success(`Processed ${results.length} document files`);
    } catch (error) {
      console.error('Document processing error:', error);
      toast.error('Failed to process document files');
    } finally {
      setProcessing(false);
      setProcessingType('');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileTypeIcon = (fileType) => {
    if (fileType.startsWith('audio/')) return <FiMusic />;
    if (fileType.startsWith('image/')) return <FiImage />;
    if (fileType.startsWith('video/')) return <FiVideo />;
    return <FiFile />;
  };

  return (
    <div className="file-upload-container">
      {/* File Upload Area */}
      <motion.div
        ref={dropRef}
        className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,image/*,video/*,.pdf,.docx,.doc,.txt,.rtf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div className="upload-content">
          <motion.div
            className="upload-icon"
            animate={{ rotate: dragActive ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <FiUpload size={48} />
          </motion.div>

          <h3>Drop files here or click to upload</h3>
          <p>Support for audio, image, video, and document files</p>

          <motion.button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Choose Files
          </motion.button>
        </div>
      </motion.div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <motion.div
          className="file-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Uploaded Files ({uploadedFiles.length})</h3>

          {uploadedFiles.map((file) => (
            <motion.div
              key={file.id}
              className="file-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="file-info">
                <div className="file-icon">
                  {getFileTypeIcon(file.type)}
                </div>
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
              </div>

              <motion.button
                className="remove-btn"
                onClick={() => removeFile(file.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX />
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Processing Options */}
      {uploadedFiles.length > 0 && (
        <motion.div
          className="processing-options"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Processing Options</h3>

          <div className="option-buttons">
            {uploadedFiles.some(f => f.type.startsWith('audio/')) && (
              <motion.button
                className="process-btn audio"
                onClick={processAudioFiles}
                disabled={processing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiMusic />
                {processing && processingType === 'transcription' ? 'Transcribing...' : 'Transcribe Audio'}
              </motion.button>
            )}

            {uploadedFiles.some(f => f.type.startsWith('image/')) && (
              <>
                <motion.button
                  className="process-btn image"
                  onClick={processImageFiles}
                  disabled={processing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiImage />
                  {processing && processingType === 'image-analysis' ? 'Analyzing...' : 'Analyze Images'}
                </motion.button>

                <motion.button
                  className="process-btn ocr"
                  onClick={extractTextFromImages}
                  disabled={processing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiFile />
                  {processing && processingType === 'ocr' ? 'Extracting...' : 'Extract Text (OCR)'}
                </motion.button>
              </>
            )}

            {uploadedFiles.some(f => f.type.includes('pdf') || f.type.includes('document') || f.type.includes('text')) && (
              <motion.button
                className="process-btn document"
                onClick={processDocumentFiles}
                disabled={processing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiFile />
                {processing && processingType === 'document-analysis' ? 'Processing...' : 'Process Documents'}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          className="results-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Processing Results ({results.length})</h3>

          {results.map((result) => (
            <motion.div
              key={result.id}
              className="result-item"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="result-header">
                <div className="result-type">
                  {result.type === 'transcription' && <FiMusic />}
                  {result.type === 'image-analysis' && <FiImage />}
                  {result.type === 'ocr' && <FiFile />}
                  {result.type === 'document-analysis' && <FiFile />}
                  <span>{result.type}</span>
                </div>
                <span className="result-file">{result.fileName}</span>
              </div>

              <div className="result-content">
                <p>{result.content}</p>
              </div>

              {result.language && (
                <div className="result-meta">
                  <span>Language: {result.language}</span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;
