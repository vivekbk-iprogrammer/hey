const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.MONGO_URL
const dbConnect = async ()=>{
   try {
    await mongoose.connect(url);
    console.log(`db connected successfully`);
   } catch (error) {
    console.log(error)
   }
}

module.exports = {dbConnect}