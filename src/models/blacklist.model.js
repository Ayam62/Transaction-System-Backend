const mongoose=require("mongoose")

const tokenBlacklistSchema=new mongoose.Schema({
    token:{
        type:String,
        required:[true,"Token is required to blacklist"],
        unique:[true,"token is already blacklisted"]
    },
  
},{timestamps:true})

tokenBlacklistSchema.index({createdAt:1},{ //{ createdAt: 1 } means ascending index on createdAt, and with expireAfterSeconds, MongoDB automatically deletes documents after that time.
    expireAfterSeconds:60*60*24*3//TTL index automatically deletes documents after a specified time (based on createdAt), so your blacklist cleans itself without manual code.
})

const tokenBlackListModel=mongoose.model("tokenBlackList",tokenBlacklistSchema);

module.exports=tokenBlackListModel;