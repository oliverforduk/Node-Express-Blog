var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    flash = require("connect-flash"),
    User = require("./models/user"),
    Notification = require("./models/notification"),
    methodOverride = require("method-override"),
    moment = require("moment");

//REQUIRING ROUTES
var authRoutes = require("./routes/index.js"),
    passRoutes = require("./routes/password.js"),
    blogpostsRoutes = require("./routes/blogposts.js"),
    commentsRoutes = require("./routes/comments.js"),
    likesRoutes = require("./routes/likes.js"),
    userRoutes = require("./routes/user.js"),
    settingRoutes = require("./routes/settings.js");

//CONFIG
app.set("view engine", "ejs");
mongoose.connect("", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = moment;

//PASSPORT CONFIG
app.use(require("express-session")({
    secret: "",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//LOCALS CONFIG
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.defaultAvatar = "";
    
    //Set notifications as local for use in header
    if(req.user){
        //Eventually filter for only where hasSeen is false AND sort by descending id
        Notification.find({"receiver": req.user.id, "hasSeen": false}, async function(err, notes){
            if(err){
                console.log(err);
            }else{
                res.locals.notes = notes;
                await next();
            }
        });
    }else{
       next(); 
    }
});

//SETTING ROUTES
app.use("/", authRoutes);
app.use("/password", passRoutes);
app.use("/user", userRoutes);
app.use("/user/settings", settingRoutes);
app.use("/blogposts", blogpostsRoutes);
app.use("/blogposts/:id/comments", commentsRoutes);
app.use("/blogposts/:id/likes", likesRoutes);


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Express_Blog has started!"); 
});