var express = require("express"),
    router = express.Router({mergeParams: true}),
    User = require("../models/user"),
    middleware = require("../middleware"),
    multer = require("multer"),
    cloudinary = require("cloudinary"),
    passport = require("passport");
    
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
// USER settings
//=============================

//A users profile settings
router.get("/:id", middleware.checkSettingsOwnership, function(req, res){
    User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        }else{
            res.render("user/settings", {user: user});
        }
    });
});

//Update a profile settings
router.put("/:id", middleware.checkSettingsOwnership, upload.single("image"), function(req, res){
    //Find user
    User.findById(req.params.id, async function(err, user){
        if(err){
           console.log(err);
        }else{
            //if image
            if(req.file){
                try{
                    if(user.avatarId){
                        // If use has an image already, destroy first
                        await cloudinary.v2.uploader.destroy(user.avatarId); 
                    }
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    //Add cloudinary url to user
                    user.avatar = result.secure_url;
                    //Add cloudinary public id as avatarId
                    user.avatarId = result.public_id;
                }catch(err){
                    return res.redirect("back");
                }
            }
            //If new bio, update bio
            user.bio = req.body.bio;
            user.save();
            
            req.flash("success", "Your profile has been updated");
            res.redirect("../profile/" + user._id + "/activity");
       }
    });
});


//A users password settings
router.get("/:id/password", middleware.checkSettingsOwnership, function(req, res){
    User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        }else{
            res.render("user/password", {user: user});
        }
    });
});

//Update a users password settings
router.put("/:id/password", middleware.checkSettingsOwnership, function(req, res){
   User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        }else{
            //Check password confirm is equal
            if(req.body.password === req.body.confirm){
                user.setPassword(req.body.password, function(err){
                    if(err){
                        console.log(err);
                        res.redirect("back");
                    }else{
                        user.save();
                        req.flash("success", "Your password has been updated");
                        res.redirect("/user/profile/" + user._id + "/activity");
                    }
                });
            }else{
                req.flash("error", "Passwords do not match");
                res.redirect("back");
            }
        }
    }); 
});

module.exports = router;