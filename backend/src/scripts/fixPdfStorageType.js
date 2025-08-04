import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Pdf from '../models/Pdf';

const fixStorageTypes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Fix embedded PDFs
    const embeddedRes = await Pdf.updateMany(
      { storageType: { $exists: false }, data: { $exists: true } },
      { $set: { storageType: 'embedded' } }
    );
    console.log(`🛠️ Updated embedded PDFs: ${embeddedRes.modifiedCount}`);

    // Fix GridFS PDFs
    const gridfsRes = await Pdf.updateMany(
      { storageType: { $exists: false }, fileId: { $exists: true } },
      { $set: { storageType: 'gridfs' } }
    );
    console.log(`🛠️ Updated GridFS PDFs: ${gridfsRes.modifiedCount}`);

    // (Optional) Log remaining invalid PDFs
    const invalids = await Pdf.find({ storageType: { $exists: false } });
    if (invalids.length > 0) {
      console.warn('⚠️ PDFs with missing storageType:', invalids.map(p => p.originalName));
    } else {
      console.log('✅ All PDFs now have storageType');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
};

fixStorageTypes();
