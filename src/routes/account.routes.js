const express=require("express")
const accountController=require("../controller/account.controller.js")
const authMiddleware=require("../middleware/auth.middleware.js")

const router=express.Router()


router.post("/create",authMiddleware.authenticateUser,accountController.createAccount)

router.get("/",authMiddleware.authenticateUser,accountController.getUserAccounts)

//get /api/accounts/balance/:accountId
router.get("/balance/:accountId",authMiddleware.authenticateUser,accountController.getBalanceById)


module.exports=router