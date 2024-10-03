const express = require("express");
const app = express();
const multer = require('multer');
const path = require("path");
const session = require('express-session');
const flash = require('connect-flash');
const exphbs = require('express-handlebars');
const port = process.env.PORT || 3000;
const hbs = require("hbs")
const collection = require("./db/conn");
const UserProfile = require("./db/userprofile");
const contacts = require("./db/contactus");
const userpoll = require('./db/userpoll');
const templatePath = path.join(__dirname, "../views");
const pollRoutes = require('./pollRoutes');
const downloadcollection = require('./downloadcollection');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const admin = require('firebase-admin');

require('dotenv').config();
const  cloud_name= process.env.CLOUD_NAME;
const  api_key= process.env.API_KEY;
const  api_secret= process.env.API_SECRET;




// Cloudinary configuration
cloudinary.config({
    cloud_name:`${cloud_name}`,
    api_key:`${api_key}`,
    api_secret:`${api_secret}`,
});












//Set Cloudinary storage engine with a custom filename
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads', // Cloudinary folder
        public_id: (req, file) => {
            // Similar to your existing file naming strategy
            return file.fieldname + '-' + Date.now();
        },
        format: async (req, file) => undefined,
    }
});
  
  // Initialize Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // Limit file size to 10MB
    fileFilter: (req, file, cb) => {
      checkFileType(file, cb);
    }
}).single('profileImage'); // Accept single image file

// Check file type function
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|avif|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
       
      cb('Error: Only images (jpeg, jpg, png, gif, avif, webp) are allowed!');
    }
}


app.use(express.static(templatePath));
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(flash());
app.use(express.urlencoded({ extended: true }));





// ** Session Middleware Setup **
app.use(session({
    secret: 'X2$8jL^!4qZ3n@T7uB5#kV$w9rP&yM1J%',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


app.use('/', pollRoutes);
app.use('/', downloadcollection);

// console.log(path.join(__dirname, "../views"));





// Middleware to check if user is logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login_signup"); // Redirect to login if not authenticated
    }
    next(); // Proceed if authenticated
}




// APP.GET
app.get("/login_signup", (req, res) => {
    res.render("login_signup", {
        signupError: req.flash('signupError'),
        loginError: req.flash('loginError'),
        UserError: req.flash('UserError'),
        successMessage: req.flash('successMessage')
    });
});


app.get("/userProfile", requireLogin, (req, res) => {
    res.redirect("/account", {
        profileError: req.flash('profileError'),

    });
});


app.get("/", (req, res) => {
    res.render("login_signup");
});


app.get("/account", requireLogin, async (req, res) => {
    
    try {
        const userId = req.session.user._id;
        console.log("ACCOUNT PAGE-->", req.session.user);
        

        // Check if the user has already submitted their profile details
        const userProfile = await UserProfile.findOne({ createdBy: userId });
        const username = req.session.user.username;

        const referUser = await collection.findOne({ username });
        const referCode = referUser.refercode;


        const successMessages = req.flash('successMessages');
        const errorMessages = req.flash('errorMessages');
        console.log(successMessages, errorMessages);

        let couponStatus = {}; // To hold the status of each coupon
        
        if (userProfile) {
            
            const usedCoupons = userProfile.couponCodesUsed || [];
            const avatar = userProfile.profileImage;
            
            

            
            const availableCoupons = ["CART80", "6FS$ZKM5CW9S8L", "WESTERNSTYLE", "TRYNEW", "FIRSTTRY", "Activated", "EXTRA400A", "GISUPER", "WELCOME10", "CTADMITAD25", "ARIAS", "ADMAJIO2105", "ADMAJIO210", "FLAT300", "BACKTOCOLLEGE", "OF20", "FREEDOMAIN", "GOYESEMI"];

            
            availableCoupons.forEach(coupon => {
                couponStatus[coupon] = usedCoupons.includes(coupon); // true if used, false if not
            });

            
            res.render("account", {
                referCode,
                userProfile,
                hasProfile: true,
                avatar,
                username,
                successMessages,
                errorMessages,
                couponStatus,
            });
        } else {
            
            res.render("account", {
                username,
                referCode,
                avatar: false,
                hasProfile: false,
                successMessages,
                errorMessages,
            });
        }

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("Server error while fetching profile details");
    }

});





//LEADERBOARD

const getTopCoinRankers = async () => {
    const topCoinRankers = await UserProfile.find({})
        .sort({ coin: -1 })  // Sort by coin in descending order
        .limit(10)  
        .populate({
            path: 'createdBy',  
            select: 'username'  
        })
        .select('coin profileImage createdBy');  

        
    const processedRankers = topCoinRankers.map(ranker => {
        if (ranker.createdBy && ranker.createdBy.username) {
            ranker.createdBy.username = ranker.createdBy.username.split('@')[0];  
        }
        ranker.profileImage = ranker.profileImage || 'uploads/profileImage-1727969251474';  // Set the path to your default image
        
        return ranker;
    });

    return processedRankers;
};

const getTopPollRankers = async () => {
    // Step 1: Populate `userId` from `Collection123` (LogInSchema)
    const topPollRankers = await userpoll.find({})
        .sort({ __v: -1 })  // Sort by the number of polls answered in descending order
        .limit(10)  
        .populate({
            path: 'userId',  // Populate userId from Collection123
            select: 'username'  // Only get the username field from Collection123
        })
        .select('__v userId');

    // Step 2: Fetch `UserProfile123` to get the `profileImage` for each user
    const processedRankers = await Promise.all(topPollRankers.map(async ranker => {
        let profileImage = 'uploads/profileImage-1727969251474'; // Default profile image

        // Fetch the UserProfile123 document using the userId
        const userProfile = await UserProfile.findOne({ createdBy: ranker.userId._id }).select('profileImage');
        if (userProfile && userProfile.profileImage) {
            profileImage = userProfile.profileImage;
        }

        // Modify the ranker object to include the profileImage and remove domain from username
        if (ranker.userId && ranker.userId.username) {
            ranker.userId.username = ranker.userId.username.split('@')[0];  // Remove domain part from username
        }

        return {
            ...ranker._doc,  // Spread the original ranker document
            profileImage     // Add profileImage to the ranker data
        };
    }));

    return processedRankers;
};

// const getTopPollRankers = async () => {
//     const topPollRankers = await userpoll.find({})
//         .sort({ __v: -1 })  
//         .limit(10)  
//         .populate({
            
//             path: 'userId',  
//             select: 'username'  
//         })
//         .select('__v userId');

    
//     const processedRankers = topPollRankers.map(ranker => {
//         if (ranker.userId && ranker.userId.username) {
//             ranker.userId.username = ranker.userId.username.split('@')[0];  // Remove everything after '@'
//         }
//         return ranker;
//     });

//     return processedRankers;
// };

app.get("/leaderboard", requireLogin, async (req, res) => {
    try {
        console.log("LEADERBOARD PAGE-->", req.session.user);
        const topPollRankers = await getTopPollRankers();
        const topCoinRankers = await getTopCoinRankers();

        const pollRankData = {};
        topPollRankers.forEach((ranker, index) => {
            pollRankData[`pollrank${index + 1}`] = ranker.userId.username;
            pollRankData[`polledrank${index + 1}`] = ranker.__v;
            pollRankData[`pollavatarrank${index + 1}`] = ranker.profileImage;
            
            
        });

        
        const coinRankData = {};
        topCoinRankers.forEach((ranker, index) => {
            coinRankData[`coinrank${index + 1}`] = ranker.createdBy.username;
            coinRankData[`coinedrank${index + 1}`] = ranker.coin;
            pollRankData[`avatarrank${index + 1}`] = ranker.profileImage;
        });

        // Combine poll and coin data into one object
        const rankData = { ...pollRankData, ...coinRankData };
        
        
        res.render("leaderboard", rankData);


    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        res.status(500).send("Internal Server Error");
    }
});





// ROUTE
app.get("/allevent", requireLogin, (req, res) => {
    console.log("ALLEVENT PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render('poll/allevent', { userId });
});
app.get("/consumer", requireLogin, (req, res) => {
    console.log("CONSUMER PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render('poll/consumer', { userId });
});
app.get("/cricket", requireLogin, (req, res) => {
    console.log("CRICKET PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/cricket", { userId });
});
app.get("/economy", requireLogin, (req, res) => {
    console.log("ECONOMY PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/economy", { userId });
});
app.get("/education", requireLogin, (req, res) => {
    console.log("EDUCATION PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/education", { userId });
});
app.get("/entertainment", requireLogin, (req, res) => {
    console.log("ENTERTAINMENT PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/entertainment", { userId });
});
app.get("/food", requireLogin, (req, res) => {
    console.log("FOOD PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/food", { userId });
});
app.get("/gadgets", requireLogin, (req, res) => {
    console.log("GADGETS PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/gadgets", { userId });
});
app.get("/gaming", requireLogin, (req, res) => {
    console.log("GAMING PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/gaming", { userId });
});
app.get("/health", requireLogin, (req, res) => {
    console.log("HEALTH PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/health", { userId });
});
app.get("/news", requireLogin, (req, res) => {
    console.log("NEWS PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/news", { userId });
});
app.get("/sharemarket", requireLogin, (req, res) => {
    console.log("SHAREMARKET PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/sharemarket", { userId });
});
app.get("/sports", requireLogin, (req, res) => {
    console.log("SPORTS PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/sports", { userId });
});
app.get("/sustain", requireLogin, (req, res) => {
    console.log("SUSTAIN PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/sustain", { userId });
});
app.get("/tech", requireLogin, (req, res) => {
    console.log("TECH PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/tech", { userId });
});
app.get("/tour", requireLogin, (req, res) => {
    console.log("TOUR PAGE-->", req.session.user);
    const userId = req.session.user._id;
    res.render("poll/tour", { userId });
});

app.get("/index", requireLogin, (req, res) => {
    res.render("index");
    //    const sessionId = req.query.sessionId; // Access the session ID
    //    res.render("index", { sessionId });
});
app.get("/customer", requireLogin, (req, res) => {
    console.log("CUSTOMER PAGE-->", req.session.user);
    res.render("customer");
});
app.get("*", (req, res) => {
    res.render("page404");
});






//SIGNUP
app.post("/signup", async (req, res) => {
    try {

        const username = req.body.username;
        const password = req.body.password;
        const passwordConfirm = req.body.passwordConfirm;


        


        if (!username || !password) {

            req.flash('signupError', 'Missing required fields');
            return res.redirect("/login_signup");

        }

        if (password !== passwordConfirm) {

            req.flash('signupError', 'Passwords do not match');
            return res.redirect("/login_signup");

        }

        // Check if user already exists
        const existingUser = await collection.findOne({ username });
        if (existingUser) {

            req.flash('signupError', 'User already exists');
            return res.redirect("/login_signup");
        }

        console.log("Signup data received:", { username, password });
        const data = { username, password };
        await collection.insertMany([data]);

        req.flash('successMessage', 'Signup successful! Please log in.');

        res.redirect("/login_signup");
    } catch (error) {
        console.error("Error during signup:", error); // Detailed logging
        res.status(500).send("Server error during sign up");
    }
});





// LOGIN
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await collection.findOne({ username });


        if (!user || user.password !== password) {

            req.flash('loginError', 'Invalid email or password');
            req.flash('UserError', 'New user please Signup');
            return res.redirect('/login_signup');
        }

        req.session.user = { _id: user._id, username: user.username };
        console.log("Session data :", req.session.user);


        const referUser = await collection.findOne({ username });
        if (!referUser.refercode) {
            const refercodeid = referUser._id;
            const refercodeidString = refercodeid.toString();
            const refercode = refercodeidString.substring(18);
            console.log("referid", refercode);
            referUser.refercode = refercode;
            await referUser.save();
        }


        res.redirect("/index");
        // res.redirect(`/index?uId=${req.sessionID}`); 
    } catch (error) {
        res.status(500).send("Server error during login");
    }
});





// USERPROFILE
app.post("/userProfile", requireLogin, async (req, res) => {

    try {
        console.log("USERPROFILE SECTION-->", req.session.user);
        const first_name = req.body.first_name;
        const last_name = req.body.last_name;
        const phone_number = req.body.phone_number;
        const email = req.body.email;
        const gender = req.body.gender;
        const age = req.body.age;

        const createdBy = req.session.user._id; 
        console.log("userProfile data received:", { first_name, last_name, phone_number, email, gender, age, createdBy });



        // Check if the user has already submitted their profile
        const existingProfile = await UserProfile.findOne({ createdBy });
        if (existingProfile) {
            // return res.status(400).send("You have already submitted your profile details.");
            req.flash('profileError', 'You have already submitted your profile details');
            return res.redirect("/account");
        }


        const userprofile = { first_name, last_name, phone_number, email, gender, age, createdBy };
        await UserProfile.insertMany([userprofile])


        try {
            const userId = req.session.user._id;

            // Check if the user has already submitted their profile details
            const userProfile = await UserProfile.findOne({ createdBy: userId });
            const username = req.session.user.username;
            if (userProfile) {
                // If profile exists, display the details on the account page
                res.render("account", {
                    userProfile,
                    hasProfile: true, // Indicate that the user has already submitted the profile
                    username,
                });
            } else {
                // If profile does not exist, show the form to submit details
                res.render("account", { username, hasProfile: false });
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            res.status(500).send("Server error while fetching profile details");
        }



    } catch (error) {
        console.error("Error during :", error); // Detailed logging
        res.status(500).send("Server error  during userProfile");
    }
}
);






// REFERRAL
app.post("/refer", async (req, res) => {
    try {
        console.log("REFER SECTION-->", req.session.user);
        const referralBy = req.body.referralBy;
        const userOwnid = req.session.user._id;

        console.log("referralBy", referralBy);

        const referringUser = await collection.findOne({ refercode: referralBy });

        const createdBy = req.session.user._id;
        

        if (!referringUser) {


            req.flash('errorMessages', 'Invalid referral code.');
            return res.redirect('/account');

        }

        const referringUserid = referringUser._id;

        

        const referuseridString = referringUserid.toString();


        const userProfile = await UserProfile.findOne({ createdBy: userOwnid });


        // Check if userProfile is null
        if (!userProfile) {
            req.flash('errorMessages', 'First complete your profile details');
            return res.redirect('/account');
        }
        const onceMorerefer = userProfile.referralBy;

        //  own refer 

        if (userOwnid === referuseridString) {

            req.flash('errorMessages', 'Cannot Enter own Refer code.');
            return res.redirect('/account');
        }



        if (onceMorerefer !== null) {
            // return res.status(500).send("cannot use more than once referral");
            req.flash('errorMessages', 'cannot use more than once referral.');
            return res.redirect('/account');

        }

        await UserProfile.updateOne(
            { createdBy: referuseridString },
            { $inc: { coin: 15 } }
        );
        await UserProfile.updateOne(
            { createdBy },
            { $set: { referralBy: referralBy }, $inc: { coin: 15 } }
        );


        req.flash('successMessages', 'Refer code applied Successfully, Please check coin .');
        return res.redirect('/account');

    } catch (error) {
        console.error("Error during :", error);
        res.status(500).send("Server error during referral");
    }
});






// CONTACTUS
app.post("/contactus", async (req, res) => {
    try {
        console.log("CONTACTUS SECTION-->", req.session.user);
        const { first_name, last_name, email, message } = req.body;

        console.log("Contact Us data received:", { first_name, last_name, email, message });

        const cont = { first_name, last_name, email, message };
        await contacts.insertMany([cont]);



        req.flash('successMessages', 'Thank you for contacting us! We will reach out soon.');



        return res.redirect('/account');
    } catch (error) {

        req.flash('errorMessages', 'Server error while processing your request. Please try again later.');


        return res.redirect('/account');
    }
});







// REDEEM 

app.post("/useCoupon", async (req, res) => {
    console.log("REDEEM SECTION-->", req.session.user);
    const userId = req.session.user._id;
    const { couponCode } = req.body;

    try {
        // Find the user by their ID
        const user = await UserProfile.findOne({ createdBy: userId });

        if (user) {

            // Check if the user has enough coins
            if (user.coin >= 10) {
                // Check if the coupon code has been used before
                if (!user.couponCodesUsed.includes(couponCode)) {
                    // Deduct 10 coins
                    user.coin -= 10;

                    // Save the used coupon code to the user's profile
                    user.couponCodesUsed.push(couponCode);
                    await user.save();

                    // If the coupon was successfully used, send a success message and the hidden text
                    req.flash('successMessages', 'Coupon code saved, Please check redeem section!');
                    return res.status(200).json({ message: '10 coins will deduct, proceed to OK.', hiddenText: couponCode });
                } else {
                    req.flash('errorMessages', 'Coupon code has already been used.');
                    return res.status(400).json({ error: 'Coupon code has already been used.' });
                }
            } else {
                // User doesn't have enough coins
                req.flash('errorMessages', 'Not enough coins to redeem the coupon.');
                return res.status(400).json({ error: 'Not enough coins to redeem the coupon.' });
            }

        } else {
            req.flash('errorMessages', 'First complete your profile details');
            return res.status(400).json({ error: 'Not enough coins to redeem the coupon.' });


        }


    } catch (error) {
        res.status(500).send({ error: 'Failed to save coupon code.' });
    }
});





//UPLOAD PROFILE PICTURE

app.post('/uploadProfileImage', async (req, res) => {
    const userId = req.session.user._id;
    
    upload(req, res, async (err) => {
      if (err) {
        console.log(err);
        req.flash('errorMessages', 'Error, please try again later!');
        return res.render('account');
      }
      else{
      if (req.file == undefined) {
        req.flash('errorMessages', 'No file selected!');
        return res.render('account');
      }}
      
      try {
        // Save image path in the user's profile in the database
        await UserProfile.findOneAndUpdate(
          { createdBy: userId }, 
          { profileImage: req.file.filename }
        );
        req.flash('successMessages', 'Avatar uploaded Successfully');
        res.redirect('account');
      } catch (error) {
        console.log(error);
        req.flash('errorMessages', 'Error saving image!');
        res.render('account');
      }
    });
  });
  







// LOGOUT
app.post("/logout", (req, res) => {
    console.log("LOGOUT-->", req.session.user);
    req.session.destroy(err => {
        if (err) {
            return res.redirect("/index");
        }
        res.redirect("/login_signup"); // Redirect to login page after logout
    });
});











app.listen(port, () => {
    console.log(`server is running at port no ${port}`);
})
