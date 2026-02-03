// Importing core modules
const path = require("path");
const fs = require("fs");
const https = require('https');

// Importing 3rd party packages
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const csrfProtection = csrf();
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

// storing database URI
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ehobquf.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

// Setting session store
const sessionStore = new MongoDBSession({
  uri: MONGODB_URI,
  collection: "sessions",
});

// Setting file storage
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const safeName = new Date().toISOString().replace(/:/g, "-");
    cb(null, safeName + "-" + file.originalname);
  },
});

// Reading the private key and certificate files
// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

// Setting file filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Importing models
const Product = require("./models/product");
const User = require("./models/user");

// Creating our express app
const app = express();

// Setting templating engine data
app.set("view engine", "ejs");
app.set("views", "views");

// Adding request logs
const requestLogsStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  {
    flags: "a",
  }
);
app.use(
  morgan("combined", {
    stream: requestLogsStream,
  })
);

// Adding secure response headers
app.use(helmet());

// Adding assets' compression middleware
app.use(compression());

// Parsing the request body
app.use(bodyParser.urlencoded({ extended: false }));

// Parsing the request body (multipart enctype)
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

// Serving files statically
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

// Starting session
app.use(
  session({
    secret: "My Secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

// Middleware to store the user data in request
// after getting it from session store
app.use((req, res, next) => {
  if (!req.session.loggedUser) {
    return next();
  }
  User.findById(req.session.loggedUser._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      res.redirect("/500");
    });
});

// Setting CSRF protection
app.use(csrfProtection);

// Setting flash messages in session
app.use(flash());

// Setting locals to every rendered view
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Importing Our routes
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorRoutes = require("./routes/error");

// Setting routes
app.use("/admin", adminRoutes.routes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorRoutes);

// Connecting to the database and starting the app
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("CONNECTED!");
    // https.createServer({key: privateKey, cert: certificate}, app)
    app
    .listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
    // res.redirect("/500");
  });
