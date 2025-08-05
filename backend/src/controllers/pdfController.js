import Pdf from '../models/Pdf.js';
import s3 from '../utils/s3Client.js';
import { v4 as uuidv4 } from 'uuid';  
import path from 'path';

// Debug function to check all environment variables
export const debugEnvironment = async (req, res) => {
  console.log('=== ALL ENVIRONMENT VARIABLES ===');
  
  // Log all environment variables (filter sensitive ones for display)
  const envVars = {};
  Object.keys(process.env).forEach(key => {
    if (key.includes('AWS') || key.includes('MONGO') || key.includes('JWT')) {
      if (key.includes('SECRET') || key.includes('KEY')) {
        envVars[key] = process.env[key] ? `SET (${process.env[key].length} chars)` : 'NOT SET';
      } else {
        envVars[key] = process.env[key] || 'NOT SET';
      }
    }
  });
  
  console.log('Filtered ENV vars:', envVars);
  
  // Check specific variables
  const specificCheck = {
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
    AWS_REGION: process.env.AWS_REGION,
    NODE_ENV: process.env.NODE_ENV
  };
  
  console.log('Specific check:', specificCheck);
  console.log('================================');
  
  res.json({
    message: 'Environment debug info',
    filtered: envVars,
    specific: specificCheck,
    processEnvKeys: Object.keys(process.env).filter(key => key.includes('AWS'))
  });
};

// Upload PDF to S3 and save metadata with extensive debugging
export const uploadPdf = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    console.log('=== UPLOAD DEBUG START ===');
    console.log('Node.js version:', process.version);
    console.log('Working directory:', process.cwd());
    console.log('Process arguments:', process.argv);
    
    // Check all AWS-related environment variables
    console.log('=== AWS ENVIRONMENT VARIABLES ===');
    const awsVars = Object.keys(process.env)
      .filter(key => key.includes('AWS'))
      .reduce((obj, key) => {
        obj[key] = process.env[key] ? (key.includes('SECRET') || key.includes('KEY') ? 'SET' : process.env[key]) : 'NOT SET';
        return obj;
      }, {});
    console.log('AWS vars found:', awsVars);

    // Direct access check
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;
    
    console.log('Direct access results:');
    console.log('- bucketName:', bucketName);
    console.log('- accessKey:', accessKey ? 'SET' : 'NOT SET');
    console.log('- secretKey:', secretKey ? 'SET' : 'NOT SET');
    console.log('- region:', region);

    // Alternative environment variable names to check
    const alternativeNames = [
      'AWS_S3_BUCKET_NAME',
      'AWS_BUCKET_NAME',
      'S3_BUCKET_NAME',
      'BUCKET_NAME'
    ];
    
    console.log('Checking alternative names:');
    alternativeNames.forEach(name => {
      console.log(`- ${name}:`, process.env[name] || 'NOT SET');
    });

    if (!bucketName) {
      // Try alternative environment variable names
      const alternateBucket = process.env.AWS_BUCKET_NAME || 
                             process.env.S3_BUCKET_NAME || 
                             process.env.BUCKET_NAME ||
                             'accaplatformbucket'; // fallback to your actual bucket name
      
      console.log('Using alternate bucket name:', alternateBucket);
      
      if (!alternateBucket || alternateBucket === 'accaplatformbucket') {
        // Hardcode temporarily for debugging
        console.log('Using hardcoded bucket name for debugging');
        process.env.AWS_S3_BUCKET_NAME = 'accaplatformbucket';
      }
    }

    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error(`AWS_S3_BUCKET_NAME environment variable is not set. Available AWS vars: ${Object.keys(awsVars).join(', ')}`);
    }

    console.log('Final bucket name to use:', process.env.AWS_S3_BUCKET_NAME);

    const extension = path.extname(file.originalname);
    const s3Key = `pdfs/${uuidv4()}${extension}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    };

    console.log('S3 params:', {
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType,
      BodyLength: params.Body.length
    });

    console.log('Attempting S3 upload...');
    const uploadResult = await s3.upload(params).promise();
    console.log('S3 Upload successful:', uploadResult.Location);
    console.log('=== UPLOAD DEBUG END ===');

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
    res.status(201).json(newPdf);

  } catch (err) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('===================');
    
    res.status(500).json({ 
      message: 'Upload failed', 
      error: err.message,
      debug: {
        availableAwsVars: Object.keys(process.env).filter(key => key.includes('AWS')),
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
};

// Keep all other existing functions unchanged
export const listPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ uploadedAt: -1 });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PDFs', error: err.message });
  }
};

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

// Updated viewPdf function in pdfController.js
export const viewPdf = async (req, res) => {
  try {
    console.log('=== VIEW PDF DEBUG START ===');
    console.log('User requesting PDF:', req.admin?._id);
    console.log('PDF ID requested:', req.params.id);
    
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ message: 'Invalid PDF ID format' });
    }
    
    const pdf = await Pdf.findById(id);
    if (!pdf) {
      console.log('PDF not found in database:', id);
      return res.status(404).json({ message: 'PDF not found' });
    }

    console.log('PDF found:', {
      id: pdf._id,
      originalName: pdf.originalName,
      s3Key: pdf.s3Key,
      contentType: pdf.contentType
    });

    // Check if bucket name is available
    if (!process.env.AWS_S3_BUCKET_NAME) {
      console.error('AWS_S3_BUCKET_NAME not configured');
      return res.status(500).json({ message: 'S3 configuration error' });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdf.s3Key,
    };

    console.log('S3 params:', params);
    console.log('Attempting to get object from S3...');

    // Test if object exists first
    try {
      await s3.headObject(params).promise();
      console.log('Object exists in S3');
    } catch (headError) {
      console.error('Object not found in S3:', headError.message);
      return res.status(404).json({ message: 'File not found in storage' });
    }

    // Set headers before streaming
    res.setHeader('Content-Type', pdf.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.originalName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust as needed for security

    console.log('Headers set, creating stream...');
    
    const stream = s3.getObject(params).createReadStream();

    stream.on('error', (err) => {
      console.error('S3 stream error:', err);
      if (!res.headersSent) {
        res.status(404).json({ message: 'File stream error', error: err.message });
      }
    });

    stream.on('end', () => {
      console.log('Stream ended successfully');
    });

    console.log('Piping stream to response...');
    stream.pipe(res);
    
    console.log('=== VIEW PDF DEBUG END ===');

  } catch (err) {
    console.error('=== VIEW PDF ERROR ===');
    console.error('Error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('=====================');
    
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error viewing PDF', 
        error: err.message,
        debug: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
};

// Enhanced middleware debugging
export const debugAuth = async (req, res, next) => {
  console.log('=== AUTH DEBUG ===');
  console.log('Headers:', req.headers);
  console.log('Authorization:', req.headers.authorization);
  console.log('Admin from middleware:', req.admin?._id);
  console.log('==================');
  next();
};

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

const pdfController = {
  debugEnvironment,
  uploadPdf,
  listPdfs,
  editPdf,
  viewPdf,
  deletePdf,
  downloadPdf,
  getAllForUser,
};

export default pdfController;