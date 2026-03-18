const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is a must!"],
        unique: true
    },
    email: {
        type: String,
        required: [true, "Email is a must"],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Please fill the password"],
        minlength: [6, "Password must be longer than 6 characters"],
        select: false 
    },
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false
    }
}, { timestamps: true });

// Corrected Async Middleware
userSchema.pre("save", async function() {
    if (!this.isModified("password")) return;
    
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;



/*3. What happens if we hash in controllers?

Imagine you have many controllers:

registerUser()
createAdmin()
updateUserPassword()
importUsers()

If hashing is in controllers:

You must remember to hash password everywhere.

If you forget once, the database stores a plain password.

That is a security bug.

4. What userSchema.pre("save") does

pre("save") is a middleware (hook) in Mongoose.

It means:

Before saving a user document, run this function.

So whenever this runs:

User.save()
User.create()
new User().save()

The password automatically gets hashed.

So even if controllers forget, model protects the database.

Think of it like:

Controller → sends password
Model → guarantees it is hashed
Database → stores safe data

*/