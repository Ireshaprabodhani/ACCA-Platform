const mongoose = require('mongoose');
const CaseQuestion = require('../models/CaseQuestion');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb+srv://ireshabandara:KTKTxKIDUvLd9cr1@acca-db.rct3aio.mongodb.net/acca-db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const res = await CaseQuestion.updateMany(
      { answer: { $exists: false }, correctAnswer: { $type: 'number' } },
      [
        { $set: { answer: '$correctAnswer' } },
        { $unset: 'correctAnswer' },
      ]
    );

    console.log(`Migrated ${res.modifiedCount} documents successfully.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
  }
})();