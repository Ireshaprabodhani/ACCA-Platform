import AWS from 'aws-sdk';

// Configure AWS with explicit credentials
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

// Test connection function
export const testS3Connection = async () => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME
    };
    
    const result = await s3.headBucket(params).promise();
    console.log('S3 bucket accessible:', process.env.AWS_S3_BUCKET_NAME);
    return true;
  } catch (error) {
    console.error('S3 connection error:', error.message);
    return false;
  }
};

export default s3;