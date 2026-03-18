const express=require("express")
const connectDB=require("./config/db.js")
const cookieParser=require("cookie-parser")

const authRouter=require("./routes/auth.routes.js")
const accountRouter=require("./routes/account.routes.js")
const transactionRoutes=require("./routes/transaction.routes.js")


require("dotenv").config()

const app=express()
connectDB()

app.use(express.json())
app.use(cookieParser())


app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transactions",transactionRoutes)


module.exports=app
