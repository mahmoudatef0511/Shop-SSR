const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const fileHelper = require("../util/file");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const Product = require("../models/product");
const Order = require("../models/order");

const PRODUCTS_PER_PAGE = 2;

exports.getStartPage = (req, res, next) => {
  res.render("shop/index", {
    pageTitle: "Start Page",
    path: "/",
  });
};

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProductsCount;
  Product.find()
    .countDocuments()
    .then((productsCount) => {
      totalProductsCount = productsCount;
      return Product.find()
        .skip((page - 1) * PRODUCTS_PER_PAGE)
        .limit(PRODUCTS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Book shop",
        path: "/products",
        totalProducts: totalProductsCount,
        currentPage: page,
        hasNextPage: page * PRODUCTS_PER_PAGE < totalProductsCount,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalProductsCount / PRODUCTS_PER_PAGE),
      });
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-details", {
        prod: product,
        pageTitle: `${product.title} details`,
        path: "/products",
      });
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then((products) => {
      res.render("shop/cart", {
        pageTitle: "Cart Page",
        path: "/cart",
        products: products,
      });
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  const user = req.user;
  Product.findById(productId)
    .then((product) => {
      return user.addToCart(product);
    })
    .then((result) => {
      return res.redirect("/cart");
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const { id } = req.body;
  req.user
    .removeFromCart(id)
    .then(() => {
      res.redirect("/cart");
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.getCheckout = (req, res, next) => {
  let products,
    totalPrice = 0;
  req.user
    .getCart()
    .then((prods) => {
      products = prods;
      products.forEach(({ price, quantity }) => {
        totalPrice += price * quantity;
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((prod) => {
          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: prod.title,
                description: prod.description,
              },
              unit_amount: prod.price * 100,
            },
            quantity: prod.quantity,
          };
        }),
        mode: "payment",
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        pageTitle: "Checkout Page",
        path: "/checkout",
        products: products,
        totalPrice: totalPrice.toFixed(2),
        sessionId: session.id,
      });
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/500");
    });
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders()
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Orders Page",
        path: "/orders",
        orders: orders,
      });
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .addOrder()
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      res.redirect("/500");
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order || order.user.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/500");
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
      const pdfDoc = new PDFDocument();
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text("Invoice");
      pdfDoc.text("---------------------");
      const { items } = order.orderItems;
      let totalPrice = 0;
      items.forEach((item) => {
        const { title, price, quantity } = item;
        totalPrice += price * quantity;
        pdfDoc.fontSize(18).text(`${title} --> ${quantity} x $${price}`);
      });
      pdfDoc.text("-----------------");
      pdfDoc.fontSize(22).text(`Total Price: $${totalPrice.toFixed(3)}`);
      pdfDoc.end();
    })
    .catch((err) => {});
};
