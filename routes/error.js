const express = require("express");

const router = express.Router();

const errorController = require("../controllers/errors");

router.get("/500", errorController.get500);
router.use(errorController.get404);

module.exports = router;
