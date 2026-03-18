/*
10 steps 
1.Validate request
2.Validate idempotency key
3.Check account status
4. Derive sender balance from ledger
5.Create transaction(PENDING)
6.Create DEBIT ledger entry
7. Create CREDIT ledger entry
8. Mark transaction COMPLETED
9.Commit MongoDB session
10.Send email notification
*/

const transactionModel=require("../models/transaction.model.js")
const ledgerModel=require("../models/ledger.model.js")
const accountModel=require("../models/account.model.js")
const userModel=require("../models/user.model.js")
const emailService=require('../services/email.service.js')
const mongoose=require("mongoose")

async function createTransaction(req,res){

    //1st step: Validate the request

    const {fromAccount,toAccount,amount,idempotencyKey}=req.body
    //here fromAccount, toAccount are id
    

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
      return  res.status(400).json({message:"Missing transaction parameters (fromAccount,toAccount,amount or idempotencyKey)"})
    }
    const fromUserAccount=await accountModel.findOne({
        _id:fromAccount,
    })

    const toUserAccount=await accountModel.findOne({
        _id:toAccount,
    })
    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({message:"The sender or receiver's account is not registered"})
    }

    //2.Second step: Validate idempotency key
    const isTransactionAlreadyExists=await transactionModel.findOne({
        idempotencyKey:idempotencyKey
    })
    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status=="COMPLETED"){
           return  res.status(200).json({
                message:"Transaction is already completed",
                transaction:isTransactionAlreadyExists
            })
        }
        if(isTransactionAlreadyExists.status="PENDING"){
           return  res.status(200).json({
                message:"Transaction is pending.Please wait patiently"
            })
        }
        if(isTransactionAlreadyExists.status="FAILED"){
           return res.status(500).json({
                message:"Transaction is failed, please try again"
            })
        }
        if(isTransactionAlreadyExists.status="REVERSE"){
           return  res.status(500).json({
                message:"Transaction was reversed.Please try again"
            })
        }
    }

    //STEP-3.Check account status whether active, forzen or closed
    if(fromUserAccount.status!="Active" || toUserAccount.status!="Active"){
       return  res.status(500).json({message:"One of the accounts is not ACTIVE !"})
    }


    //STEP-4: Derive sender balance from ledger. function is implemented in account.model.js
    const balance=await fromUserAccount.getBalance()

    if(balance<amount){
        return res.status(400).json({message:`Insufficeint balance.Current balance is Rs.${balance} and you have to pay Rs.${amount}`})

    }

    try{
            //Step-5.Create transaction(PENDING)
            const session=await mongoose.startSession()
            session.startTransaction() //yo vanda paxadi jun jun kaam hunxa, kita tyo sabai complete hunxa , bich ma kei error aayo vane feri yei state ma revert back hunxa

            const transaction=(await  transactionModel.create([{
                fromAccount,
                toAccount,
                amount,
                idempotencyKey,
                status:"PENDING"
            }],{session}))[0]

            //Step-6:Create DebitLedgerEntry

            const debitLedgerEntry=await ledgerModel.create([{
                account:fromAccount,
                amount:amount,
                transaction:transaction._id,
                type:"CREDIT",
            }],{session})

            await(()=>{
                return new Promise((resolve)=>setTimeout(resolve,3*2000))
            })


            //Step-7:Create CreditLedgerEntry

            const creditLedgerEntry=await ledgerModel.create([{
                account:toAccount,
                amount:amount,
                transaction:transaction._id,
                type:"DEBIT",
            }],{session})

            //Step-8:Mark transaction as completed

            // transaction.status="COMPLETED"
            // await transaction.save({session})
            await transactionModel.findOneAndUpdate(
                {_id:transaction._id},
                {status:"COMPLETED"},
                {session}
            )

            //Step-9.Commit MongoDB session
            await session.commitTransaction()
            session.endSession()// upto here from startSession if any of the above fails , the transation is reverted back
            }
    catch(err){
        return res.status(400).json({message:"Transaction failed due to some unforseen circumstances."})
    }
    //Step-10 Send Email notification.
    await emailService.sendTransactionEmail(
        req.user.email,
        req.user.username,
        amount,
        toAccount
    )
    res.status(200).json({message:"transaction completed"})

}

async function createInitialFundsTransaction(req,res){
    const {toAccount,amount,idempotencyKey}=req.body

    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"toAccount,amount or idempotencyKey is not provided"
        })
    }

    const toUserAccount=await accountModel.findOne({
        _id:toAccount,
    })

    if(!toUserAccount){
        return res.status(400).json({
            message:"Invalid toAccount"
        })
    }

    const fromUser = await userModel.findOne({ systemUser: true }).select('+systemUser')

    if(!fromUser){
        return res.status(400).json({
            message:"System user not found. Please create a system user first."
        })
    }
    // console.log("SYSTEM USER ID:", fromUser._id)

    // const allAccounts = await accountModel.find({})
    // console.log("ALL ACCOUNTS:", allAccounts)

    const fromUserAccount = await accountModel.findOne({
        user: fromUser._id
    })
    console.log(fromUserAccount)
    

    if(!fromUserAccount){
        return res.status(400).json({
            message:"System user account not found. Please create an account for the system user."
        })
    }
    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction=new transactionModel({ //creating client side instance
        fromAccount:fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING",
    })


    const debitLedgerEntry=await ledgerModel.create([{
        account:fromUserAccount._id,
        amount:amount,
        transaction:transaction._id,
        type:"DEBIT",
    }],{session})

    const creditLedgerEntry=await ledgerModel.create([{//sytax demands array
        account:toUserAccount._id,
        amount,
        transaction:transaction._id,
        type:"CREDIT",
    }],{session})

    transaction.status="COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message:"Initial funds transaction completed successfully.",
        transaction:transaction
    })




}

module.exports={createTransaction,createInitialFundsTransaction}