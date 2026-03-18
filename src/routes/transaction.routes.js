const express=require("express")
const authMiddleware=require("../middleware/auth.middleware.js")
const transactionController=require("../controller/transaction.controller.js")

const routes=express.Router()

//create new transaction
routes.post("/",authMiddleware.authenticateUser,transactionController.createTransaction)

//Create initial finds tarnasaction
routes.post("/system/initial-fund",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction)

module.exports=routes