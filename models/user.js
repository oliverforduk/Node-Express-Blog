var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    avatar: String,
    avatarId: String,
    bio: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {
        type: Boolean,
        default: false
    },
    favourites: {
        type: Array,
    },
    privacy: {
            type: Boolean,
            default: false
        },
    following: Array,
    followers: Array
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);