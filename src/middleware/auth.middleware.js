require("dotenv").config()
const userModel=require("../models/user.model.js")
const jwt=require("jsonwebtoken")
const tokenBlackListModel=require("../models/blacklist.model.js")


async function authenticateUser(req,res,next){
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1]
    if(!token){
        res.status(401).json({message:"You are not logged in."})
    }
    const isBlaclisted=await tokenBlackListModel.findOne({token})
    if(isBlaclisted){
        return res.status(401).json({
            message:"Unauthorized access,token is invalid"
        })
    }


    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        const user=await  userModel.findById(decoded.userId) //extract user from the userid
        req.user=user 
        console.log(req.user) 
        next()
        return 
        
    }catch(err){
        return res.status(401).json({message:"Invalid token2222"})
    }
}

async function authSystemUserMiddleware(req,res,next){
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1]
    if(!token){
        return res.status(401).json({
            message:"Unauthorized access,token is missing"
        })
    }
     const isBlaclisted=await tokenBlackListModel.findOne({token})
    if(isBlaclisted){
        return res.status(401).json({
            message:"Unauthorized access,token is invalid"
        })
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        const user=await userModel.findById(decoded.userId).select("+systemUser")
        if(!user.systemUser){
            return res.status(403).json({
                message:"Forbidden access,not a system user"
            })
        }
        req.user=user
        // console.log("Hiiii",req.user)
        return next()
    }
    catch(err){
        return res.status(401).json({
            message:"Unauthorized access,token is invalid"
        })
    }




}

module.exports={authenticateUser,authSystemUserMiddleware}