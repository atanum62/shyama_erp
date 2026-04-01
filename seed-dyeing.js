const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const MONGODB_URL = env.MONGODB_URL || env.MONGODB_URI;
const DB_NAME = env.MONGODB_NAME || 'shyama_erp';

async function seed() {
    try {
        await mongoose.connect(MONGODB_URL, { dbName: DB_NAME });
        const Party = mongoose.connection.collection('parties');

        const party = {
            name: "AARADHYA PROCESSINGG",
            code: "AARADHYA",
            type: "DyeingHouse",
            contactNumber: "9007928989",
            address: "JL No. 23, Ghosh Para, Taldharia, Dist.: 24pgs North, Pin - 700130",
            gstin: "19ACEFA4676N1ZS",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const existing = await Party.findOne({ name: { $regex: new RegExp("^" + party.name + "$", "i") } });
        if (existing) {
            console.log(`Party ${party.name} already exists.`);
        } else {
            await Party.insertOne(party);
            console.log(`Successfully added ${party.name}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
