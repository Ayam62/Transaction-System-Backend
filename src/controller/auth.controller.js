const userModel=require("../models/user.model.js")
const jwt=require("jsonwebtoken")
require("dotenv").config()
const emailService=require("../services/email.service.js")
const tokenBlackListModel=require("../models/blacklist.model.js")

async function registerUser(req,res){
    const {username,email,password}=req.body

    try{
        const isExists=await userModel.findOne({
            email:email
        })
        if(isExists){
            return res.status(422).json({
                message:"User already exists"
            })
        }
        
       const user= await userModel.create({
            username,
            email,
            password
        })

        const token=jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})
        res.cookie("token",token)

        res.status(201).json({
            message:"User created Sucessfully",
            user,
            token:token,
        })
        await emailService.sendRegistrationEmail(user.email,user.name)
    }
    catch(err){
        console.error("Error details:", err)
        res.status(500).json({message:"Error creating user"})
    }

}
async function loginUser(req,res){
    const {email,password}=req.body

    try{
        const user=await userModel.findOne({email:email}).select("+password")
        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        const isMatch=await user.comparePassword(password)
        if(!isMatch){
            return res.status(401).json({message:"Invalid credentials"})
        }

        const token=jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})
        res.cookie("token",token)

        res.status(200).json({
            message:"Login successful",
            user,
            token:token,
        })
    //    await  emailService.sendEmail(user.email,user.username)
    }
    catch(err){
        res.status(500).json({message:"Invalid credentials"})
    }
}

async function logout(req,res){
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1]
    
   
    if(!token){
        return res.status(200).json({message:"No token found so already logged out."})
    }
    
    try{
        res.cookie("token","")
        await tokenBlackListModel.create({
        token:token
        })

    res.status(200).json({
        message:"User logged out successfully."
    })
    }
    catch(err){
        return res.status(400).json({message:"Logout Unsuccessful."})
    }

 


}

module.exports={registerUser,loginUser,logout}