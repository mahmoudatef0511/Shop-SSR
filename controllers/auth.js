const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const transport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport(
  transport({
    auth: {
      api_key:
        process.env.SENDGRID_KEY,
    },
  })
);

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login Page",
    path: "/login",
    errorMessage: null,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login Page",
      path: "/login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }
  return User.findOne({ email: email })
    .then((user) => {
      return bcrypt
        .compare(password, user.password)
        .then((result) => {
          if (!result) {
            return res.render("auth/login", {
              pageTitle: "Login Page",
              path: "/login",
              errorMessage: "Invalid password!",
              oldInput: {
                email: email,
                password: password,
              },
              validationErrors: errors.array(),
            });
          }
          req.session.loggedUser = user;
          req.session.isLoggedIn = true;
          req.session.save((err) => {
            console.log("Error: ", err);
            res.redirect("/");
          });
        })
        .catch((err) => {
          res.redirect("/500");
        });
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup Page",
    path: "/signup",
    errorMessage: null,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  const errors = validationResult(req);
  console.log("Sign up errors: ", errors.array());
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      pageTitle: "Signup Page",
      path: "/signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((user) => {
      return transporter.sendMail({
        to: user.email,
        from: "mahmoudelbadawy3333@gmail.com",
        subject: "Successful Sign Up!",
        html: "<h1>You've signed up successfully!!</h1>",
      });
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log("Error: ", err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  const errorEmailMessage = req.flash("errorEmail");
  res.render("auth/reset", {
    pageTitle: "Reset Page",
    path: "/reset",
    errorEmail: errorEmailMessage.length === 0 ? null : errorEmailMessage,
  });
};

exports.postReset = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        req.flash("errorEmail", "No user found with this email!");
        return res.redirect("/reset");
      }
      req.session.userEmail = user.email;
      return res.redirect("/update-password");
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.getUpdatePassword = (req, res, next) => {
  if (!req.session.userEmail) {
    return res.redirect("/reset");
  }
  const errorPasswordMessage = req.flash("errorPass");
  res.render("auth/update-password", {
    pageTitle: "Update Password Page",
    path: "/update-password",
    errorPassword:
      errorPasswordMessage.length === 0 ? null : errorPasswordMessage,
  });
};

exports.postUpdatePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  User.findOne({ email: req.session.userEmail })
    .then((user) => {
      return bcrypt.compare(currentPassword, user.password).then((result) => {
        if (!result) {
          req.flash("errorPass", "Invalid current password!");
          return res.redirect("/update-password");
        }
        if (newPassword !== confirmNewPassword) {
          req.flash("errorPass", "Passwords don't match!");
          return res.redirect("/update-password");
        }
        return bcrypt
          .hash(newPassword, 12)
          .then((hashedPassword) => {
            user.password = hashedPassword;
            return user.save();
          })
          .then(() => {
            return res.redirect("/login");
          })
          .catch((err) => {
            res.redirect("/500");
          });
      });
    })
    .catch((err) => {
      res.redirect("/500");
    });
};
