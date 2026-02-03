const express = require("express");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const { check } = require("express-validator");

const router = express.Router();

router.get("/add-product", isAuth, adminController.getAddProduct);
router.post(
  "/add-product",
  isAuth,
  [
    check("title", "Please enter a valid title!")
      .trim()
      .isLength({ min: 3 })
      .isString(),
    check("price", "Please enter a valid price!").isFloat(),
    check("description", "Please enter a valid description!")
      .trim()
      .isLength({ min: 5 }),
  ],
  adminController.postAddProduct
);
router.get("/products", isAuth, adminController.getAdminProducts);
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);
router.post(
  "/edit-product",
  isAuth,
  [
    check("title", "Please enter a valid title!")
      .trim()
      .isLength({ min: 3 })
      .isString(),
    check("price", "Please enter a valid price!").isFloat(),
    check("description", "Please enter a valid description!")
      .trim()
      .isLength({ min: 5 }),
  ],
  adminController.postEditProduct
);
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

exports.routes = router;
