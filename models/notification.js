var mongoose = require("mongoose");

var notificationSchema = new mongoose.Schema({
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    noteType: String,
    hasSeen: {
        type: Boolean,
        default: false
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blogpost"
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model("Notification", notificationSchema);