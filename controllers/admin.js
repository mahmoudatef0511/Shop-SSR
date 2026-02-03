const Product = require("../models/product");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { deleteFile } = require("../util/file");

exports.getAdminProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.getAddProduct = (req, res, next) => {
  res.render("admin/add-product", {
    pageTitle: "Add New Product",
    path: "/admin/add-product",
    editing: false,
    product: {},
    errorMessage: null,
    oldInput: {
      title: "",
      price: 0,
      description: "",
    },
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const errors = validationResult(req);
  const { title, price, description } = req.body;
  const image = req.file;
  if (!image) {
    return res.status(422).render("admin/add-product", {
      pageTitle: "Add New Product",
      path: "/admin/add-product",
      editing: false,
      product: {},
      errorMessage: "Unsupported file type!",
      oldInput: {
        title: title,
        price: price,
        description: description,
      },
      validationErrors: [],
    });
  }
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/add-product", {
      pageTitle: "Add New Product",
      path: "/admin/add-product",
      editing: false,
      product: {},
      errorMessage: errors.array()[0].msg,
      oldInput: {
        title: title,
        price: price,
        description: description,
      },
      validationErrors: errors.array(),
    });
  }
  const imageURL = "\\" + image.path;
  const product = new Product({
    title: title,
    description: description,
    imageURL: imageURL,
    price: price,
    userId: req.user,
  });
  return product
    .save()
    .then(() => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit === "true";
  if (!editMode) {
    return res.redirect("/");
  }
  const productId = req.params.productId;
  return Product.findById(productId)
    .then((product) => {
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        errorMessage: null,
        oldInput: {
          title: product.title,
          price: product.price,
          description: product.description,
        },
        validationErrors: [],
      });
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.postEditProduct = (req, res, next) => {
  const errors = validationResult(req);
  const { id, title, price, description } = req.body;
  const image = req.file;
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      product: {
        _id: id,
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  Product.findById(id)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/admin/products");
      }
      if (image) {
        deleteFile(product.imageURL);
        product.imageURL = "\\" + image.path;
      }
      product.title = title;
      product.price = price;
      product.description = description;
      return product.save().then(() => res.redirect("/admin/products"));
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.deleteProduct = (req, res, next) => {
  const { productId } = req.params;
  Product.findByIdAndDelete({ _id: productId, userId: req.user._id })
    .then((product) => {
      // console.log(product.imageURL);
      deleteFile(product.imageURL);
      // console.log(product);
      res.status(200).json({ message: "SUCCESS!" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Product deletion failed." });
    });
};
