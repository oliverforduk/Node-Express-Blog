var express = require("express"),
    router = express.Router({mergeParams: true}),
    User = require("../models/user"),
    Blogpost = require("../models/blogpost"),
    Notification = require("../models/notification"),
    middleware = require("../middleware");

//=============================
// USER ROUTES
//=============================

//A users profile
router.get("/profile/:id", function(req, res){
    var perPage = 12,
        pageQuery = parseInt(req.query.page),
        pageNumber = pageQuery ? pageQuery : 1,
        path = "/user/profile/" + req.params.id;
        
    User.findById(req.params.id, function(err, user){
       if(err){
           console.log(err);
       } else{
           //Find user's posts
           Blogpost.find({"author.id": user.id}).populate("comments").sort({"_id": "descending"}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, blogposts){
              if(err){
                  console.log(err);
              }else{
                  
                  Blogpost.countDocuments({"author.id": user.id}).exec(function(err, count){
                    if(err){
                        res.redirect("back");
                    }else{
                        if(req.user){
                            var follows = req.user.following.indexOf(user._id);
                            return res.render("user/profile", {
                                        user: user,
                                        blogposts: blogposts,
                                        folPos: follows,
                                        current: pageNumber,
                                        pages: Math.ceil(count / perPage),
                                        search: false,
                                        path: path
                                    });
                        }
                        
                        res.render("user/profile", {
                            user: user,
                            blogposts: blogposts,
                            folPos: -1,
                            current: pageNumber,
                            pages: Math.ceil(count / perPage),
                            search: false,
                            path:path
                        });
                    }
                });
              }
           });
       }
    });
});

//Activity
router.get("/profile/:id/activity", function(req, res){
    var perPage = 12,
        pageQuery = parseInt(req.query.page),
        pageNumber = pageQuery ? pageQuery : 1,
        path = "/user/profile/" + req.params.id + "/activity";
    
    User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        }else{
            //Find ALL notes for user & store 
            Notification.find({"sender": req.params.id}).populate("post")
                                                        .populate("receiver")
                                                        .populate("sender")
                                                        .populate("comment").sort({"_id": "descending"}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, notes){
                if(err){
                    console.log(err);
                }else{
                    Notification.countDocuments({"sender": req.params.id}).exec(function(err, count){
                        if(err){
                            res.redirect("back");
                        }else{
                            if(req.user){
                                var follows = req.user.following.indexOf(user._id);
                                return res.render("user/activity", {
                                    notifications: notes, 
                                    user: user, 
                                    folPos: follows,
                                    current: pageNumber,
                                    pages: Math.ceil(count / perPage),
                                    search: false,
                                    path: path
                                });
                            }
                            
                            res.render("user/activity", {
                                notifications: notes, 
                                user: user, 
                                folPos: -1,
                                current: pageNumber,
                                pages: Math.ceil(count / perPage),
                                search: false,
                                path: path
                            });
                        }
                    });
                }
            });
        }
    });
});

//Favourites
router.get("/profile/:id/favourites", function(req, res){
    var perPage = 12,
        pageQuery = parseInt(req.query.page),
        pageNumber = pageQuery ? pageQuery : 1,
        path = "/user/profile/" + req.params.id + "/favourites";
        
    User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        } else{
            //Find user's favourites
            Blogpost.find({"_id": user.favourites}).populate("comments").sort({"_id": "descending"}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, blogposts){
                if(err){
                    console.log(err);
                }else{
                  
                    Blogpost.countDocuments({"_id": user.favourites}).exec(function(err, count){
                        if(err){
                            res.redirecct("back");
                        }else{
                            if(req.user){
                                var follows = req.user.following.indexOf(user._id);
                                return res.render("user/favourites", {
                                    user: user, 
                                    blogposts: blogposts, 
                                    folPos: follows,
                                    current: pageNumber,
                                    pages: Math.ceil(count / perPage),
                                    search: false,
                                    path: path
                                });
                            }
                          
                            res.render("user/favourites", {
                                user: user, 
                                blogposts: blogposts, 
                                folPos: -1,
                                current: pageNumber,
                                pages: Math.ceil(count / perPage),
                                search: false,
                                path: path
                            });
                        }
                    });
                }
            });
        }
    });
});

//Notifications
router.get("/profile/:id/notifications", middleware.isLoggedIn, function(req, res){
    var perPage = 12,
        pageQuery = parseInt(req.query.page),
        pageNumber = pageQuery ? pageQuery : 1,
        path = "/user/profile/" + req.params.id + "/notifications";
        
    User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        }else{
            //Find ALL notes for user & store 
            Notification.find({"receiver": req.user.id}).populate("post")
                                                        .populate("sender")
                                                        .populate("comment").sort({"_id": "descending"}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, notes){
                if(err){
                    console.log(err);
                }else{
                    Notification.countDocuments({"receiver": req.user.id}).exec(function(err, count){
                        if(err){
                            res.redirect("back");
                        }else{
                            //Find NEW notes and set hasSeen to true
                            Notification.find({"receiver": req.user.id, "hasSeen": false}, function(err, newNotes){
                                if(err){
                                    console.log(err);
                                }else{
                                    newNotes.forEach(function(note){
                                        note.hasSeen = true;
                                        note.save();
                                    });
                                }
                            });
                    
                            //Send to template with old array 
                            res.render("user/notifications", {
                                notifications: notes, 
                                user: user,
                                current: pageNumber,
                                pages: Math.ceil(count / perPage),
                                search: false,
                                path: path
                            });
                        }
                    });
                }
            });
        }
    });
});

//=============================
// FOLLOWS AND FAVOURITES
//=============================

//Current users follows blogposts
router.get("/following", middleware.isLoggedIn, function(req, res){
    //Find all blogpost by authors within users following array
    var perPage = 12,
        pageQuery = parseInt(req.query.page),
        pageNumber = pageQuery ? pageQuery : 1,
        path = "/user/following";
        
    Blogpost.find({"author.id": { $in: req.user.following}}).populate("comments").sort({"_id": "descending"}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, blogposts){
        if(err){
            console.log(err);
        }else{
           
           
            //Find all posts for sidebar
            Blogpost.find({ image: { $exists: true } }).populate("comments").sort({"_id": "descending"}).exec(function(err, sideposts){
                if(err){
                    return res.redirect("back");
                }
            
                Blogpost.countDocuments({"author.id": { $in: req.user.following}}).exec(function(err, count){
                    if(err){
                        res.redirect("back");
                    }else{
                        res.render("user/show", {
                        blogposts: blogposts,
                        sideposts: sideposts,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        search: false,
                        path: path
                       });
                    }
                });
            });
        }
    });
});

//Add a user to follows
router.post("/:id/follow", middleware.isLoggedIn, function(req, res){
    //Add current user to posters followers list
    User.findById(req.params.id, function(err, poster){
       if(err){
           console.log(err);
       }else{
           poster.followers.push(req.user._id);
           poster.save();
           
           //Add poster to current users following list
            User.findById(req.user._id, function(err, user){
                if(err){
                    console.log(err);
                }else{
                    user.following.push(poster._id);
                    user.save();
                    
                    //Create notification
                    var note = new Notification;
                    note.receiver = poster._id;
                    note.sender = req.user._id;
                    note.noteType = "follow";
                    note.save();
                    
                    res.redirect("back");
                }
            });
       }
    });
});

//Remove a user from follows
router.delete("/:id/follow", middleware.isLoggedIn, function(req, res){
    //Delete current user from posters followers list
    User.findById(req.params.id, function(err, poster){
        if(err){
            console.log(err);
        }else{
            //find position of user in posters followers array
            var i = poster.followers.indexOf(req.user._id);
            poster.followers.splice(i, 1);
            poster.save();
            
            //Delete poster from current users following list
            User.findById(req.user._id, function(err, user){
                if(err){
                    console.log(err);
                }else{
                    //Use folPos to delete poster
                    user.following.splice(req.body.folPos, 1);
                    user.save();
                    res.redirect("back");
                }
            });
        }
    });
});

//Adds a post to users favourites
router.post("/:post_id/favourite", middleware.isLoggedIn, function(req, res){
    //Add blogpost id to users favourites list
    Blogpost.findById(req.params.post_id, function(err, blogpost){
       if(err){
           console.log(err);
       }else{
           blogpost.favourited.push(req.user._id);
           blogpost.save();
           
           //Add user id to blogpost favourited list
           User.findById(req.user._id, function(err, user){
               if(err){
                   console.log(err);
               }else{
                   user.favourites.push(blogpost._id);
                   user.save();
                   
                   //Create notification (As long as the reciever !== sender)
                    if(!blogpost.author.id.equals(req.user._id)){
                        var note = new Notification;
                        note.receiver = blogpost.author.id;
                        note.sender = req.user._id;
                        note.noteType = "favourite";
                        note.post = blogpost.id;
                        note.save();
                    }
                   
                   res.redirect("/blogposts/" + req.params.post_id);
               }
           });
       }
    });
});

//Removes a post from users favourites
router.delete("/:post_id/favourite", function(req, res){
    //Remove blogpost id to users favourites list 
    Blogpost.findById(req.params.post_id, function(err, blogpost){
       if(err){
           console.log(err);
       }else{
           var i = blogpost.favourited.indexOf(req.user._id);
           blogpost.favourited.splice(i, 1);
           blogpost.save();
           
           //Remove user id to blogpost favourited list
           User.findById(req.user._id, function(err, user){
               if(err){
                   console.log(err);
               }else{
                   user.favourites.splice(req.body.favPos, 1);
                   user.save();
                   
                   res.redirect("/blogposts/" + req.params.post_id);
               }
           });
       }
    });
});

module.exports = router;