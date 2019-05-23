var mongoose = require("mongoose");

var blogpostSchema = new mongoose.Schema({
    title: String,
    image: String,
    imageId: String,
    body: String,
    tags: Array,
    createdAt: {
        type: Date,
        default: Date.now
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    likes: [],
    favourited: []
});

module.exports = mongoose.model("Blogpost", blogpostSchema);