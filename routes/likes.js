var express = require("express"),
    router = express.Router({mergeParams: true}),
    Blogpost = require("../models/blogpost"),
    Notification = require("../models/notification"),
    middleware = require("../middleware");

//=============================
// LIKES ROUTES
//=============================

//Creates a like on Blogost
router.post("/", middleware.isLoggedIn, function(req, res){
   Blogpost.findById(req.params.id, function(err, blogpost){
       if(err){
           console.log(err);
       }else{
           blogpost.likes.push(req.user._id);
           blogpost.save();
           
           //Create notification (As long as the reciever !== sender)
            if(!blogpost.author.id.equals(req.user._id)){
                var note = new Notification;
                note.receiver = blogpost.author.id;
                note.sender = req.user._id;
                note.noteType = "like";
                note.post = blogpost.id;
                note.save();
            }
            
           res.redirect("/blogposts/" + blogpost._id);
       }
   });
});

router.delete("/", function(req, res){
   //find blogpost
  Blogpost.findById(req.params.id, function(err, blogpost){
      if(err){
          console.log(err);
      } else{
          //delete like using indexof
          blogpost.likes.splice(req.body.arrPos, 1);
          blogpost.save();
          res.redirect("/blogposts/" + req.params.id);
      }
  });
});

module.exports = router;