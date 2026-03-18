const accountModel=require("../models/account.model.js")

async function createAccount(req,res){
    try{
            const user=req.user;//comes from middleware 
            const {status="Active",currency="NPR"}=req.body

            const account=await accountModel.create({
                user:user._id,
                status,
                currency
            })
            res.status(201).json({
                message:"Account created successfully",
                account
            })
    }catch(err){
        res.status(500).json({message:"Error creating account"})
    }
}

async function getUserAccounts(req,res){
    console.log("Hiiii",req.user)
    try{
        const accounts=await accountModel.find({user:req.user._id})
        
        res.status(200).json({
            accounts
        })
}
catch(err){
    return res.status(500).json({message:"Error in finding the account"})
}

}

async function getBalanceById(req,res){
    const {accountId}=req.params;
    console.log(accountId)
    console.log(req.user._id)


    const account=await accountModel.findOne({
        // _id:accountId,
        user:req.user._id
    })

    if(!account){
        return res.status(404).json({
            message:"Account not found"
        })
    }
    const balance=await account.getBalance()

    res.status(200).json({
        message:"Balance fetched",
        accountId:account._id,
        balance:balance
    })

}

module.exports={createAccount,getUserAccounts,getBalanceById}