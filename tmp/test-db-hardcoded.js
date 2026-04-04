
const mongoose = require('mongoose');

const URI = "mongodb://sumanta:sp2003@ac-hujjtjb-shard-00-00.sgkj4bs.mongodb.net:27017,ac-hujjtjb-shard-00-01.sgkj4bs.mongodb.net:27017,ac-hujjtjb-shard-00-02.sgkj4bs.mongodb.net:27017/shyama_erp?ssl=true&replicaSet=atlas-1404j8-shard-0&authSource=admin&retryWrites=true&w=majority";
const DB = "shyama_erp";

async function run() {
  console.log("Connecting...");
  try {
    await mongoose.connect(URI, { dbName: DB });
    console.log("SUCCESS!");
    const names = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", names.map(n => n.name));
  } catch (e) {
    console.error("FAIL:", e.message);
    console.error("FULL:", e);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}
run();
