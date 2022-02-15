require("dotenv").config();
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRound = 10;
const today = require(__dirname + "/modules/date.js");
const mailCenter = require(__dirname + "/modules/mailCenter.js");

//Initialize the application
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

//Connect to mongoDB
mongoose.connect(process.env.CONNECTIONSTRING, {useNewUrlParser:true});

//User schema
const userSchema = new mongoose.Schema({
   fName : String,
   lName : String,
   email : String,
   password : String
});

//User model
const User = new mongoose.model("User", userSchema);

//User authenticated
let userAuthenticated = {};

//Global app states
let isAuthenticated = false;
let existingEmail = false;
let emailNotExist = false;
let passwordNotExist = false;
let isPasswordIncorrect = false;
let passwordLessThenHeightChar = false;
let passwordNotMatch = false;
let passwordChanged = false;
let reset = false;
let notReset = false;

//Pages Title
let signUpPageTitle = false;
let homePageTitle = false;
let signInPageTitle = false;
let resetPageTitle = false;
let changePageTitle = false;

//Nav items
let homeNavItem ;
let changepassNavItem ;

const year = today.year();

//-------------------------------ROUTES--------------------------------

//Home route
app.get('/', (req, res)=>{
    homePageTitle = true;

    changepassNavItem = "";
    homeNavItem = "active"
    
    res.render('index', 
    {
        isAuthenticated,
        userAuthenticated,
        homeNavItem,
        changepassNavItem,
        homePageTitle,
        signUpPageTitle,
        signInPageTitle,
        resetPageTitle,
        changePageTitle,
        year
    });
    homePageTitle = false;
});

//User registration route
app.route('/register')
    .get((req, res)=>{
        signUpPageTitle = true;

        homeNavItem = "";

        res.render('register',
         {
             isAuthenticated,
             existingEmail,
             passwordLessThenHeightChar,
             changepassNavItem,
             homeNavItem,
             signUpPageTitle,
             homePageTitle,
             signInPageTitle,
             resetPageTitle,
             changePageTitle,
             year
         });
         
         existingEmail = false;
         passwordLessThenHeightChar = false;
         signUpPageTitle = false;
         
    })
    .post((req, res)=>{

        User.findOne({email : req.body.email}, (err, foundUser)=>{
            if(foundUser){
                existingEmail = true;
                res.redirect('/register');
            }else if(req.body.password.length < 8){
                passwordLessThenHeightChar = true;
                res.redirect('/register');
            }else{
                bcrypt.hash(req.body.password, saltRound, (err, hash)=>{
                    if(err){
                        console.log(err);
                    }else{
                        const user = new User(
                            {
                                fName : req.body.fName,
                                lName : req.body.lName,
                                email : req.body.email,
                                password : hash
                            });

                            user.save();
                            userAuthenticated = user;
                            isAuthenticated = true;

                            res.redirect('/');
                    };
                });
            }
        });
    });

//Login route
app.route('/login')
    .get((req, res)=>{
        signInPageTitle = true;

        homeNavItem = ""
        changepassNavItem = ""

        res.render('login', 
        {
            emailNotExist,
            isPasswordIncorrect,
            isAuthenticated,
            homeNavItem,
            changepassNavItem,
            homePageTitle,
            signUpPageTitle,
            signInPageTitle,
            resetPageTitle,
            changePageTitle,
            year
        });

        emailNotExist = false;
        isPasswordIncorrect = false;
        signInPageTitle = false;
    })
    .post((req, res)=>{
        User.findOne({email : req.body.email}, (err, foundUser)=>{
            if(!foundUser){
                emailNotExist = true;
                res.redirect('/login');
            }else{
                bcrypt.compare(req.body.password, foundUser.password, (err, result)=>{
                    if(result === true){
                        isAuthenticated = true;
                        userAuthenticated = foundUser;
                        res.redirect('/');
                    }else{
                        isPasswordIncorrect = true;
                        res.redirect('/login');
                    };
                });
            };
        });
    });

//Reset password route
app.route('/reset')
    .get((req, res)=>{
        resetPageTitle = true;

        homeNavItem = "";
        changepassNavItem ="";

        res.render('resetPassword', 
        {
            emailNotExist,
            homeNavItem,
            changepassNavItem,
            isAuthenticated,
            resetPageTitle,
            homePageTitle,
            signUpPageTitle,
            signInPageTitle,
            changePageTitle,
            year,
            reset,
            notReset
        });

        emailNotExist = false;
        reset = false;
        notReset = false;
        resetPageTitle = false;
    })
    .post((req, res)=>{
        User.findOne({email : req.body.email}, (err, foundUser)=>{
            if(foundUser){
                bcrypt.hash(mailCenter.generatedPassword(), saltRound, (err, hash)=>{
                    if(err){
                        console.log(err);
                    };
                    User.updateOne({email : req.body.email}, {password : hash}, (err)=>{
                        if(err){
                            console.log(err);
                        }else{
                            mailCenter.transporter.sendMail(mailCenter.options(req.body.email), (err, info)=>{
                                if(err){
                                    notReset = true;
                                    res.redirect('/reset');
                                }else{
                                    reset = true;
                                    res.redirect('/reset');
                                }
                            });
                        };
                    });
                });
                
            }else{
                emailNotExist = true;
                res.redirect('/reset');
            }
        });
    });

//Change password route
app.route('/change')
    .get((req, res)=>{
        changePageTitle = true;

        if(!isAuthenticated){
            res.redirect('/login');
        }

           homeNavItem ="";
           changepassNavItem = "active";
        res.render('changePassword', {
            passwordNotExist,
            passwordNotMatch, 
            passwordLessThenHeightChar,
            isAuthenticated,
            passwordChanged,
            homeNavItem,
            changePageTitle,
            homePageTitle,
            signInPageTitle,
            signUpPageTitle,
            resetPageTitle,
            changepassNavItem,
            year
        });

        passwordNotExist = false;
        passwordNotMatch = false;
        passwordLessThenHeightChar = false;
        passwordChanged = false;
        changePageTitle = false;
    })
    .post((req, res)=>{
        if(!isAuthenticated){
            res.redirect('/login');
        }

        bcrypt.compare(req.body.oldpassword, userAuthenticated.password, (err, result)=>{
            if(result === true){
                if(req.body.newpassword !== req.body.confirmpassword){
                    passwordNotMatch = true;
                    res.redirect('/change');
                }else if(req.body.confirmpassword.length < 8){
                    passwordLessThenHeightChar = true;
                    res.redirect('/change');
                }else{
                    bcrypt.hash(req.body.confirmpassword, saltRound, (err, hash)=>{
                        if(err){
                            console.log(err);
                        }else{
                            User.updateOne({email : userAuthenticated.email}, {password : hash}, (err)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    passwordChanged = true;
                                    res.redirect('/change');
                                };
                            });
                        };
                    });
                };
            }else{
                passwordNotExist = true;
                res.redirect('/change');
            };
        });

    });

//Sing out route
app.get('/singOut', (req, res)=>{
    isAuthenticated = false;
    userAuthenticated = {};

    res.redirect('/');
});

//----------------------------END ROUTES--------------------------------------------

app.listen(process.env.PORT || 8000, ()=>console.log("The app is running on port 8000"));