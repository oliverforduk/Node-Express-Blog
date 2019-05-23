var express = require("express"),
    router = express.Router(),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto"),
    User = require("../models/user");

//=============================
// PASSWORD ROUTES
//=============================

//Show submit for password reset
router.get("/", function(req, res){
   res.render("password/forgot"); 
});

//Password token and send email
router.post("/", function(req, res, next){
    async.waterfall([
        function(done){
            //Create token
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        function(token, done){
            //Find user with email submitted
            User.findOne({email: req.body.email}, function(err, foundUser){
                if(err || !foundUser){
                    req.flash("error", "No acount with that email address exists");
                    return res.redirect("/password");
                }
                //Token expires in 1 hour
                foundUser.resetPasswordToken = token;
                foundUser.resetPasswordExpires = Date.now() + 3600000;
                foundUser.save(function(err){
                    done(err, token, foundUser);
                });
            });
        },
        function(token, foundUser, done){
            //Transport setup
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "",
                    pass: ""
                }
            });
            //Message to be sent
            var mailOptions = {
                to: foundUser.email,
                from: "",
                subject: "Node.js Password Reset",
                text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                      "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                      "http://" + req.headers.host + "/password/reset/" + token + "\n\n" +
                      "If you did not request this, please ignore this email and your password will remain unchanged.\n"
            };
            //Send mail
            smtpTransport.sendMail(mailOptions, function(err){
                req.flash("success", "An email has been sent to " + foundUser.email + " with further instrutions.");
                done(err, "done");
            });
        }
    ], function(err){
        if(err) return next(err);
        res.redirect("/password");
    });
});

//Show reset form
router.get("/reset/:token", function(req, res){
    //Find user that makes token criteria
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, foundUser){
        if( err || !foundUser){
            req.flash("error", "Password reset token is invalid or has expired");
            return res.redirect("/password");
        }
        res.render("password/reset", {token: req.params.token});
    });
});

//Reset password and send confirmation
router.post("/reset/:token", function(req, res){
    async.waterfall([
        function(done){
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now( ) } }, function(err, foundUser){
                if(err || !foundUser){
                    req.flash("error", "Password reset token is invalid or has expired");
                    return res.redirect("back");
                }
                if(req.body.password === req.body.confirm){
                    foundUser.setPassword(req.body.password, function(err){
                        if(err){
                            console.log(err);
                            return res.redirect("back");
                        }
                        foundUser.resetPasswordToken = undefined;
                        foundUser.resetPasswordExpires = undefined;
                        foundUser.save(function(err){
                            if(err){
                                console.log(err);
                                return res.redirect("back");
                            }
                            req.logIn(foundUser, function(err){
                                done(err, foundUser);
                            });
                        });
                    });
                }else{
                    req.flash("error", "Passwords do not match");
                    return res.redirect("back");
                }
            });
        },
        function(foundUser, done){
            //Send confirmation email
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "",
                    pass: ""
                }
            });
            var mailOptions = {
                to: foundUser.email,
            from: "",
            subject: "Your password has been changed",
            text: "Hello,\n\n" +
                  "This is a confirmation that the password for your account " + foundUser.email + " has just been changed.\n"
            };
            smtpTransport.sendMail(mailOptions, function(err){
                req.flash("success", "Your password has been successfully changed");
                done(err);
            });
        }
    ], function(err){
        if(err){
            console.log(err);
            return res.redirect("back");
        }
        res.redirect("/blogposts");
    });
});

module.exports = router;