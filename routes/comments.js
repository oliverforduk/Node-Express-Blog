var express = require("express"),
    router = express.Router({mergeParams: true}),
    Blogpost = require("../models/blogpost"),
    Comment = require("../models/comment"),
    User = require("../models/user"),
    Notification = require("../models/notification"),
    middleware = require("../middleware");
    
//=============================
// COMMENTS ROUTES
//=============================

//Shows form to make a comment
router.get("/new", middleware.isLoggedIn, function(req, res){
    Blogpost.findById(req.params.id, function(err, blogpost){
       if(err){
           console.log(err);
       }else{
           res.render("comments/new", {blogpost: blogpost});
       }
    });
});

//Creates a comment
router.post("/", middleware.isLoggedIn, function(req, res){
    Blogpost.findById(req.params.id, function(err, blogpost){
        if(err){
            console.log(err);
        } else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                }else{
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                  
                    blogpost.comments.push(comment);
                    blogpost.save();
                    
                    //Create notification
                    var note = new Notification;
                    note.sender = req.user._id;
                    note.noteType = "owncomment";
                    note.post = blogpost.id;
                    note.comment = comment.id;
                  
                    //Receiver only set if user doesn't own post
                    if(!blogpost.author.id.equals(req.user._id)){
                        note.receiver = blogpost.author.id;
                        note.noteType = "comment";
                    }
                    
                    note.save();
                    
                    req.flash("success", "Comment added");
                    res.redirect("/blogposts/" + blogpost._id);
                }
            });
        }
    });
});

//Shows edit form
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    //Check blogpost id is correct
    Blogpost.findById(req.params.id, function(err, foundBlogpost){
        if(err){
            console.log(err);
        }else{
            Comment.findById(req.params.comment_id, function(err, foundComment){
                if(err){
                    console.log(err);
                }else{
                    res.render("comments/edit", {blogpost: foundBlogpost, comment: foundComment});
                }
            });
        }
    });
});

//Edits a comment
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, comment){
      if(err){
          console.log(err);
          res.redirect("back");
      } else{
          req.flash("success", "Comment updated");
          res.redirect("/blogposts/" + req.params.id);
      }
   });
});

//Delete a comment
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
           res.redirect("back");
       }else{
           req.flash("success", "Comment deleted");
           res.redirect("/blogposts/" + req.params.id);
       }
   });
});

module.exports = router;