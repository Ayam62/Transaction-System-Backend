const mongoose=require("mongoose")
const ledgerModel=require("../models/ledger.model.js")



const accountSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"Account must be associated with a user"],
        index:true //because speed increases in search.... this index is used to find when user is only queried
    },
    status:{
        type:String,
        enum:{
            values:["Active","FROZEN","CLOSED"],
            message:"Status can be either ACTIVE, FROZEN or CLOSED",
            default:"Active"
        }
    },
    currency:{
        type:String,
        required:[true,"Currenct is required for creating an account"],
        default:"NPR"
    },
   


},{timestamps:true})

accountSchema.index({user:1,status:1}) // this helps us find when both user and status is queried

accountSchema.methods.getBalance= async function(){ // making custom  in mongoose
    const balanceData=await ledgerModel.aggregate([ //this is aggregation pipeline
        {$match:{account:this._id}},
        {
            $group:{
                _id:null,
                totalDebit:{
                    $sum:{
                        $cond:[
                            {$eq:["$type","DEBIT"]},
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit:{
                    $sum:{
                        $cond:[
                            {$eq:["$type","CREDIT"]},
                            "$amount",
                            0
                        ]
                    }
                }
            },

        },
        {
           $project : {
            _id:0,
            balance:{$subtract:["$totalCredit","$totalDebit"]}
        }
       }
       

    ])

    if(balanceData.length==0){
        return 0
    }
    return balanceData[0].balance

}



const accountModel=mongoose.model("account",accountSchema)
module.exports=accountModel