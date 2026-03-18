const mongoose=require("mongoose")
require("dotenv").config()

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connected successfully")

    }catch(err){
        console.log(err)
        console.log("Error connecting database")
        process.exit(1)
    }
}

module.exports=connectDB


