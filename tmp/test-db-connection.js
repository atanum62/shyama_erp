
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
const DB_NAME = process.env.MONGODB_NAME || 'shyama_erp';

async function testConnection() {
  console.log(`📡 Testing connection to ${MONGODB_URI?.split('@')[1]} [DB: ${DB_NAME}]`);
  try {
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log('✅ Connection successful!');
    
    // Check if parties collection exists and has data
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const count = await mongoose.connection.collection('parties').countDocuments();
    console.log(`Parties count: ${count}`);
    
    const sample = await mongoose.connection.collection('parties').findOne();
    console.log('Sample party:', sample);

  } catch (err) {
    console.error('❌ Connection failed:', err);
    console.error('Error string:', String(err));
    console.error('Error properties:', Object.keys(err));
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testConnection();
