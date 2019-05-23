var express = require("express"),
    router = express.Router(),
    Blogpost = require("../models/blogpost"),
    Comment = require("../models/comment"),
    User = require("../models/user"),
    Notification = require("../models/notification"),
    middleware = require("../middleware"),
    multer = require("multer"),
    cloudinary = require("cloudinary");

//=============================
// STORAGE CONFIG
//=============================
var storage = multer.diskStorage({
  filename: function(req, file, callback){
    //Name for image file
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function(req, file, cb){
  //Accept only image files
  if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

var upload = multer({storage: storage, fileFilter: imageFilter});

cloudinary.config({
 cloud_name: "",
 api_key: "",
 api_secret: ""
});

//=============================
// BLOGPOSTS ROUTES
//=============================

//Found on stack overflow, adds security to search
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

//INDEX - Shows all blogposts
router.get("/", function(req, res){
  //Pagination vars
  var perPage = 12,
      pageQuery = parseInt(req.query.page),
      pageNumber = pageQuery ? pageQuery : 1,
      path = "/blogposts";
  var noMatch = null;
  
  if(req.query.search){
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    
    Blogpost.find({"title": regex}).populate("comments").skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, searchBlogposts){
      if(err){
        console.log(err);
        res.redirect("back");
      }
      
      //Find all posts for sidebar (filter to only find posts with an image)
      Blogpost.find({ image: { $exists: true } }).populate("comments").sort({"_id": "descending"}).exec(function(err, sideposts){
          if(err){
            return res.redirect("back");
          }
          
          Blogpost.countDocuments({"title": regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, count){
            if(err){
              console.log(err);
              res.redirect("back");
            }else{
              if(searchBlogposts.length < 1){
                noMatch = "No results found, try searching by post title.";
              }
              res.render("blogposts/index", {
                blogposts: searchBlogposts, 
                sideposts: sideposts,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                noMatch: noMatch,
                path: path,
                search: req.query.search 
              });
            }
          });
        });
      });
  }else{
    //Get all blogposts from DB
    Blogpost.find({}).populate("comments").sort({"_id": "descending"}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allBlogposts){
      if(err){
          console.log(err);
      }else{
          
        //Find all posts for sidebar (filter to only find posts with an image)
        Blogpost.find({ image: { $exists: true } }).populate("comments").sort({"_id": "descending"}).exec(function(err, sideposts){
          if(err){
            return res.redirect("back");
          }
          
          Blogpost.countDocuments().exec(function(err, count){
            if(err){
              res.redirect("back");
            }else{
                res.render("blogposts/index", {
                  blogposts: allBlogposts,
                  sideposts: sideposts,
                  current: pageNumber,
                  pages: Math.ceil(count / perPage),
                  noMatch: noMatch, 
                  path: path,
                  search: false,
                });
              }
            });
          });
        }
    });
  }
});

//Shows new blogpost form
router.get("/new", middleware.isLoggedIn, function(req, res){
  res.render("blogposts/new", {user: req.user});
});

//Create a blogpost
router.post("/", middleware.isLoggedIn, upload.single("image"), async function(req, res){
  //Add author to blogpost
  req.body.blogpost.author = {
    id: req.user._id,
    username: req.user.username
  };
    
  //If a image has been uploaded
  if(req.file){
    try{
      var result = await cloudinary.v2.uploader.upload(req.file.path);
      //Add cloudinary url to blogpost.image
      req.body.blogpost.image = result.secure_url;
      //Add cloudinary public id as blogpost.imageId
      req.body.blogpost.imageId = result.public_id;
      
      //Create blogpost
      Blogpost.create(req.body.blogpost, function(err, blogpost){
        if(err){
          console.log(err);
          req.flash("error", "Something went wrong, please try again");
          return res.redirect("back");
        }
        req.flash("success", "Your post has been added");
        return res.redirect("/blogposts");
      });
        
    }catch(err){
      return res.redirect("back");
    }
  }else{
    //Create blogpost
    Blogpost.create(req.body.blogpost, function(err, blogpost){
      if(err){
        console.log(err);
        req.flash("error", "Something went wrong, please try again");
        return res.redirect("back");
      }else{
        //Create notification
        var note = new Notification;
        note.sender = req.user._id;
        note.noteType = "post";
        note.post = blogpost.id;
        note.save();
        
        req.flash("success", "Your post has been added");
        res.redirect("/blogposts");
      }
      
    });
  }
});

//Shows specific blogpost
router.get("/:id", function(req, res){
  //get blogpost from DB
  Blogpost.findById(req.params.id).populate({path: "comments", options: {sort:{"_id": "descending"}}}).exec(function(err, blogpost){
    if(err){
        console.log(err);
    }else{
      //Find all posts for sidebar (filter to only find posts with an image)
      Blogpost.find({ image: { $exists: true } }).populate("comments").sort({"_id": "descending"}).exec(function(err, sideposts){
        if(err){
            return res.redirect("back");
        }
          
        //Find author
        User.findById(blogpost.author.id, function(err, author){
          if(err){
            console.log(err);
          }else{
            //Get followers length
            var followers = author.followers.length;
            
            //check if liked & if follower
            if(req.user){
              var likes = blogpost.likes.indexOf(req.user._id);
              var favourited =blogpost.favourited.indexOf(req.user._id);
              var follows = req.user.following.indexOf(blogpost.author.id);
              return res.render("blogposts/show", {blogpost: blogpost, sideposts: sideposts, followers: followers, arrPos: likes, folPos: follows, favPos: favourited});
            }
            
            res.render("blogposts/show", {blogpost: blogpost, sideposts: sideposts, followers: followers, arrPos: -1, folPos: -1, favPos: -1});
          }
        });
          
      });
        
    }
  });
});

//Shows edit form
router.get("/:id/edit", middleware.checkBlogpostOwnership, function(req,res){
  Blogpost.findById(req.params.id, function(err, blogpost){
    if(err){
      console.log(err);
    }else{
      res.render("blogposts/edit", {blogpost: blogpost, user: req.user});
    }
  });
});

//Edit a blogpost
router.put("/:id", middleware.checkBlogpostOwnership, upload.single("image"), function(req, res){
  Blogpost.findById(req.params.id, async function(err, updatedBlogpost){
    if(err){
      console.log(err);
    }else{
      //If a image has been uploaded
      if(req.file){
        try{
          if(updatedBlogpost.image){
            //Destroy current image file
            await cloudinary.v2.uploader.destroy(updatedBlogpost.imageId);   
          }
          //Upload new image
          var result = await cloudinary.v2.uploader.upload(req.file.path);
          //Add cloudinary url to blogpost.image
          updatedBlogpost.image = result.secure_url;
          //Add cloudinary public id as blogpost.imageId
          updatedBlogpost.imageId = result.public_id;
        }catch(err){
          console.log(err);
          return res.redirect("back");
        }
      }
      //Update blogpost
      updatedBlogpost.title = req.body.blogpost.title;
      updatedBlogpost.body = req.body.blogpost.body;
      updatedBlogpost.save();
      
      req.flash("success", "Your post has been updated");
      res.redirect("/blogposts/" + req.params.id);
    }
  });
});

//Delete a blogpost
router.delete("/:id", middleware.checkBlogpostOwnership, function(req, res){
  //Delete comments on blogpost
  Blogpost.findById(req.params.id, function(err, blogpost){
      if(err){
          console.log(err);
      }else{
          blogpost.comments.forEach(function(comment){
              Comment.findByIdAndRemove(comment, function(err){
                  if(err){
                      console.log(err);
                  }
              });
          });
      }
  });
  //Delete blogpost
  Blogpost.findById(req.params.id, async function(err, blogpost){
    if(err){
      console.log(err);
      return res.redirect("back");
    }
    if(blogpost.image){
      try{
        //Destroy cloudinary image
        await cloudinary.v2.uploader.destroy(blogpost.imageId);
        blogpost.remove();
        req.flash("success", "Your post has been removed");
        res.redirect("/blogposts");
      }catch(err){
        return res.redirect("back");
      }
    }else{
      blogpost.remove();
      req.flash("success", "Your post has been removed");
      res.redirect("/blogposts");
    }
    
  });
});

module.exports = router;