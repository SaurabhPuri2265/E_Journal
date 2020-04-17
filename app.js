//jshint esversion:6
const session = require('express-session');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

//const passport = require("passport");
//const passportLocalMongoose = require("passport-local-mongoose");
//const flash = require('express-flash');

const homeStartingContent = ["In your daily life , you often encounter some things which you surely cannot remember for a long time.", "So the easiest way to keep those things is to create some notes about them.", "Lets COMPOSE some of them."]
const aboutContent = ["This Project is creation of Gully Bois & Corp.", " Every attempt has been made to ensure a good note-making service to the users.", " Help us by refering our project to the audience.", " Thank You!!"];
const contactContent = ["Saurabh Puri   MCA(404)", "Aditya Thakur    MCA(404)", "Chello Yana     MCA(404)"];
const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({ secret: "iqudhquwkdfhdg", resave: false, saveUninitialized: true }));
//app.use(flash());

mongoose.connect("mongodb+srv://Saurabh:letitgo100@cluster0-jyuhd.mongodb.net/blogDB", { useNewUrlParser: true });

const postSchema = {
    title: String,
    content: String,
    currDate: String
};

const Post = mongoose.model("Posts", postSchema);

const userSchema = new mongoose.Schema({
    Name: String,
    password: String,
    diary: []
});

const secret = "MyNameIsSaurabh";
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });

const User = mongoose.model("User", userSchema);

app.get("/", function(req, res) {
    // prints date & time in YYYY-MM-DD format
    //console.log(year + "-" + month + "-" + date);
    res.render("start");
});

app.get("/home", function(req, res) {
    const newUser = req.session.user;
    const name = req.session.user.Name;
    const posts_array = req.session.user.diary;
    res.render("home", { posts: posts_array, homes: homeStartingContent, displayName: name });

    req.session.user = newUser;
});


app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register", { popshow: 3 });
});

app.get("/compose", function(req, res) {
    res.render("compose");
});

app.post("/compose", function(req, res) {
    //Getting current date
    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    var inputDate = date + "-" + month + "-" + year;

    const post = new Post({
        title: req.body.postTitle,
        content: req.body.postBody,
        currDate: inputDate
    });
    const loggedUser = req.session.user.Name;
    //console.log(loggedUser);
    User.findOne({ Name: loggedUser }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else if (foundUser) {
            foundUser.diary.unshift(post);
            foundUser.save();
        }
    });
    req.session.user.diary.push(post);
    res.redirect("/home");
});

app.get("/posts/:postTitle", function(req, res) {
    var reqtitle = req.params.postTitle;
    var newTitle = reqtitle.substring(1, reqtitle.length);
    var loggedUser = req.session.user.Name;
    User.findOne({ Name: loggedUser }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else if (foundUser) {
            var obj = foundUser.diary;
            for (var i = 0; i < obj.length; i++) {
                if (obj[i].title == newTitle) {
                    res.render("post", { post_title: obj[i].title, post_content: obj[i].content, post_currDate: obj[i].currDate });
                    break;
                }
            }

        }
    });

});

app.get("/about", function(req, res) {
    res.render("about", { abouts: aboutContent });
});

app.get("/contact", function(req, res) {
    res.render("contact", { contacts: contactContent });
});

app.get("/about1", function(req, res) {
    res.render("about1", { abouts: aboutContent });
});

app.get("/contact1", function(req, res) {
    res.render("contact1", { contacts: contactContent });
});

app.get("/logout", function(req, res) {
    res.render("start");
});

app.get("/forgetPassword", function(req, res) {
    res.render("forgetPassword");
});

app.get("/delete/:postTitle", function(req, res) {
    var reqTitle = req.params.postTitle.substring(1, req.params.postTitle.length);
    var logName = req.session.user.Name;
    console.log(reqTitle);
    User.findOne({ Name: logName }, function(err, foundUser) {
        if (foundUser) {
            var idx;
            for (var i = 0; i < foundUser.diary.length; i++) {
                if (foundUser.diary[i].title == reqTitle) {
                    foundUser.diary.splice(i, 1);
                    foundUser.save();
                    req.session.user = foundUser;
                    break;
                }
            }
        }

        res.redirect("/home");

    });

});

app.post("/forgetPassword", function(req, res) {
    var pass1 = req.body.password1;
    var pass2 = req.body.password2;
    var reguser = req.body.username;

    if (pass1 != pass2) {
        res.render("forgetPassword");
    } else {
        User.findOne({ Name: reguser }, function(err, foundUser) {
            if (err)
                console.log(err);
            else if (foundUser) {
                foundUser.password = pass1;
                foundUser.save();
                res.redirect("/login");
            }
        });

    }

});


app.post("/register", function(req, res) {
    const newUser = new User({
        Name: req.body.username,
        password: req.body.password,
        diary: []
    });
    dummy = req.body.username;
    User.findOne({ Name: dummy }, function(err, foundUser) {
        if (foundUser) {
            var flag = Number(1);
            res.render("register", { popshow: flag });
        } else {
            newUser.save(function(err) {

                req.session.user = newUser;
                res.redirect("/home");
            });
        }
    });
});


app.post("/login", function(req, res) {
    var flag;
    var username = req.body.username;
    var password = req.body.password;
    User.findOne({ Name: username }, function(err, foundUser) {
        if (!err)
            if (foundUser) {
                if (foundUser.password == password) {
                    req.session.user = foundUser;
                    res.redirect("/home");
                } else {
                    var flag = Number(1);
                    res.render("forgetPassword", { popshow: flag });
                }
            } else {
                var flag = Number(2);
                res.render("register", { popshow: flag });
            }
    });
});


app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");
});