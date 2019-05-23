var Blogpost = require("../models/blogpost"),
    Comment = require("../models/comment"),
    User = require("../models/user");
var middlewareObj = {};

middlewareObj.checkBlogpostOwnership = function(req, res, next){
    //Check user is logged in
    if(req.isAuthenticated()){
        Blogpost.findById(req.params.id, function(err, blogpost){
            if(err || !blogpost){
                console.log(err);
                res.redirect("back");
            }else{
                if(blogpost.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "Please sign in to continue");
        res.redirect("/login");
    }
};

middlewareObj.checkCommentOwnership = function(req, res, next){
    //Check user is logged in
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, comment){
            if(err){
                console.log(err);
                res.redirect("back");
            }else{
                if(comment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "Please sign in to continue");
        res.redirect("/login");
    }
};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please sign in to continue");
    res.redirect("/login");
};

middlewareObj.checkSettingsOwnership = function(req, res, next){
    //Check logged in user owns URL userid
    if(req.isAuthenticated()){
        User.findById(req.params.id, function(err, user){
            if(err){
                console.log(err);
                res.redirect("back");
            }else{
                if(user._id.equals(req.user._id)){
                    next();
                }else{
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "Please sign in to continue");
        res.redirect("/login");
    }
};

module.exports = middlewareObj;