var express = require("express"),
    router = express.Router(),
    User = require("../models/user.js"),
    passport = require("passport");


//ROOT ROUTE
router.get("/", function(req, res){
  res.redirect("/blogposts");
});

//=============================
// AUTH ROUTES
//=============================

//Show sign up form
router.get("/register", function(req, res){
   res.render("register"); 
});

//Show admin sign up form
router.get("/admin-register", function(req, res){
   res.render("adminregister"); 
});

//Handle sign up logic
router.post("/register", function(req, res){
   //Create a new user
   var newUser = new User({
      username: req.body.username,
      email: req.body.email
   });
   //checks if an admin account (must match string)
    if(req.body.adminCode == ""){
        newUser.isAdmin = true;
    }
    //Add user to database
    User.register(newUser, req.body.password, function(err, user){
       if(err){
            req.flash("error", "Username or email already taken, please try again");
            res.redirect("back");
       }else{
           //Sign in user
           passport.authenticate("local")(req, res, function(){
              req.flash("success", "Account created, welcome to ACNLBlog");
              res.redirect("/blogposts");
           });
       }
    });
});

//Show login form
router.get("/login", function(req, res){
   res.render("login");
});

//Handle login logic
router.post("/login", passport.authenticate("local",
//Success redirect back will only work if using login through modals, otherwise it will get stuck on the backup login page
   {
      successRedirect: "back",
      failureRedirect: "back",
      failureFlash: true
   }), function(req, res){
});

//logout
router.get("/logout", function(req, res){
   req.logout();
   res.redirect("/blogposts");
});

module.exports = router;