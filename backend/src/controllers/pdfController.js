import Pdf from '../models/Pdf.js';
import s3, { testS3Connection } from '../utils/s3Client.js';
import { v4 as uuidv4 } from 'uuid';  
import path from 'path';

// Upload PDF to S3 and save metadata
export const uploadPdf = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    // Debug: Log all environment variables
    console.log('=== ENVIRONMENT VARIABLES ===');
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME);
    console.log('==============================');

    // Check if required environment variables are set
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
    }
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS_ACCESS_KEY_ID environment variable is not set');
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_SECRET_ACCESS_KEY environment variable is not set');
    }
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION environment variable is not set');
    }

    // Test S3 connection
    const connectionTest = await testS3Connection();
    if (!connectionTest) {
      throw new Error('Failed to connect to S3 bucket');
    }

    const extension = path.extname(file.originalname);
    const s3Key = `pdfs/${uuidv4()}${extension}`;

    console.log('=== UPLOAD DETAILS ===');
    console.log('File name:', file.originalname);
    console.log('File size:', file.size);
    console.log('File type:', file.mimetype);
    console.log('S3 Key:', s3Key);
    console.log('=====================');

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    };

    console.log('=== S3 UPLOAD PARAMS ===');
    console.log('Bucket:', params.Bucket);
    console.log('Key:', params.Key);
    console.log('ContentType:', params.ContentType);
    console.log('Body length:', params.Body.length);
    console.log('========================');

    // Perform the upload
    console.log('Starting S3 upload...');
    const uploadResult = await s3.upload(params).promise();
    console.log('S3 Upload successful!');
    console.log('Upload result:', {
      Location: uploadResult.Location,
      Bucket: uploadResult.Bucket,
      Key: uploadResult.Key,
      ETag: uploadResult.ETag
    });

    // Save to MongoDB
    const newPdf = new Pdf({
      originalName: file.originalname,
      s3Key,
      size: file.size,
      contentType: file.mimetype,
      uploadedBy: req.admin._id,
      title: req.body.title || '',
      description: req.body.description || '',
    });

    await newPdf.save();
    console.log('PDF metadata saved to MongoDB:', newPdf._id);

    res.status(201).json(newPdf);
  } catch (err) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    console.error('===================');
    
    // Provide specific error responses
    if (err.message.includes('environment variable is not set')) {
      return res.status(500).json({ 
        message: 'Server configuration error', 
        error: err.message
      });
    }
    
    if (err.code === 'NoSuchBucket') {
      return res.status(500).json({ 
        message: 'S3 bucket not found', 
        error: `Bucket '${process.env.AWS_S3_BUCKET_NAME}' does not exist or is not accessible`
      });
    }
    
    if (err.code === 'InvalidAccessKeyId') {
      return res.status(500).json({ 
        message: 'AWS credentials error', 
        error: 'Invalid AWS Access Key ID'
      });
    }
    
    if (err.code === 'SignatureDoesNotMatch') {
      return res.status(500).json({ 
        message: 'AWS credentials error', 
        error: 'Invalid AWS Secret Access Key'
      });
    }

    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// Test endpoint to check configuration
export const testConfig = async (req, res) => {
  try {
    const config = {
      environment: process.env.NODE_ENV || 'development',
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'SET (length: ' + process.env.AWS_ACCESS_KEY_ID.length + ')' : 'NOT SET',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'SET (length: ' + process.env.AWS_SECRET_ACCESS_KEY.length + ')' : 'NOT SET',
        region: process.env.AWS_REGION || 'NOT SET',
        bucketName: process.env.AWS_S3_BUCKET_NAME || 'NOT SET'
      }
    };

    // Test S3 connection
    const s3Connection = await testS3Connection();
    config.s3Connection = s3Connection ? 'SUCCESS' : 'FAILED';

    res.json(config);
  } catch (error) {
    res.status(500).json({ 
      message: 'Configuration test failed', 
      error: error.message 
    });
  }
};

// List all PDFs for admin
export const listPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ uploadedAt: -1 });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PDFs', error: err.message });
  }
};

// Edit PDF metadata
export const editPdf = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const pdf = await Pdf.findByIdAndUpdate(id, { title, description }, { new: true });
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

// View PDF (inline display)
export const viewPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdf.s3Key,
    };

    const stream = s3.getObject(params).createReadStream();

    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.originalName}"`);

    stream.on('error', (err) => {
      console.error('S3 view error:', err);
      res.status(404).json({ message: 'File not found on S3' });
    });

    stream.pipe(res);
  } catch (err) {
    console.error('View error:', err);
    res.status(500).json({ message: 'Error viewing PDF', error: err.message });
  }
};

// Delete PDF (S3 + MongoDB)
export const deletePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdf.s3Key,
    };

    await s3.deleteObject(params).promise();
    await Pdf.findByIdAndDelete(id);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};

// Download PDF (force download)
export const downloadPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await Pdf.findById(id);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdf.s3Key,
    };

    const stream = s3.getObject(params).createReadStream();

    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.originalName}"`);

    stream.on('error', (err) => {
      console.error('S3 download error:', err);
      res.status(404).json({ message: 'File not found on S3' });
    });

    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: 'Error downloading PDF', error: err.message });
  }
};

// User endpoint to get list of PDFs (with URLs)
export const getAllForUser = async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ uploadedAt: -1 });
    const response = pdfs.map(pdf => ({
      _id: pdf._id,
      originalName: pdf.originalName,
      title: pdf.title,
      description: pdf.description,
      filename: pdf.filename,
      url: `/api/pdf/view/${pdf._id}`
    }));
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PDFs', error: err.message });
  }
};