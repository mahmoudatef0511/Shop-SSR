const express = require("express");
const { check } = require("express-validator");
const User = require("../models/user");

const router = express.Router();

const authController = require("../controllers/auth");

router.get("/login", authController.getLogin);
router.post(
  "/login",
  [
    check("email", "Please enter a valid email!")
      .isEmail()
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (!user) {
            return Promise.reject("No user found with this email!");
          }
        });
      }),
    check(
      "password",
      "Please enter a valid password with 6 characters that are letters & numbers only!"
    )
      .trim()
      .isLength({ min: 6 })
      .isAlphanumeric(),
  ],
  authController.postLogin
);
router.get("/signup", authController.getSignup);
router.post(
  "/signup",
  [
    check("email", "Please enter a valid email!")
      .isEmail()
      .normalizeEmail()
      .custom((value, { req }) => {
        const validDomains = [
          "@gmail.com",
          "@yahoo.com",
          "@hotmail.com",
          "@outlook.com",
        ];
        const validDomainsCheck = validDomains.some((validDomain) =>
          value.includes(validDomain)
        );
        return validDomainsCheck;
      })
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((fetchedUser) => {
          if (fetchedUser) {
            return Promise.reject("Email already exists!");
          }
        });
      }),
    check(
      "password",
      "Please enter a valid password with 6 characters that are letters & numbers only!"
    )
      .trim()
      .isLength({ min: 6 })
      .isAlphanumeric(),
    check("confirmPassword", "Passwords don't match!")
      .trim()
      .custom((value, { req }) => {
        return value === req.body.password;
      }),
  ],
  authController.postSignup
);
router.post("/logout", authController.postLogout);
router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);
router.get("/update-password", authController.getUpdatePassword);
router.post("/update-password", authController.postUpdatePassword);

module.exports = router;
