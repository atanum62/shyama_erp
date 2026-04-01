const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually read .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const MONGODB_URL = env.MONGODB_URL || env.MONGODB_URI;
const DB_NAME = env.MONGODB_NAME || 'shyama_erp';

async function check() {
    try {
        await mongoose.connect(MONGODB_URL, { dbName: DB_NAME });
        const Consumption = mongoose.connection.collection('consumptions');
        const DiameterMapping = mongoose.connection.collection('diametermappings'); // collection names are usually plural lowercase
        
        const cList = await Consumption.find({}).toArray();
        const dmList = await DiameterMapping.find({}).toArray();

        console.log('--- Consumptions Products ---');
        cList.forEach(c => console.log(`- ${c.productName} (${c.variations?.length || 0} variations)`));
        
        console.log('\n--- Diameter Mapping Products ---');
        dmList.forEach(dm => console.log(`- ${dm.productName} (${dm.mappings?.length || 0} mappings)`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
