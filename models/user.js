const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product = require("./product");
const Order = require("./order");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex(
    (prod) => product._id.toString() === prod.productId.toString()
  );
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex < 0) {
    updatedCartItems.push({ productId: product._id, quantity: 1 });
  } else {
    updatedCartItems[cartProductIndex].quantity++;
  }
  const updatedCart = { items: [...updatedCartItems] };
  this.cart = { ...updatedCart };
  return this.save();
};

userSchema.methods.getCart = function () {
  let modifiedProducts = [];
  let returnedProducts = [];
  let lastProducts = [];
  const productsIds = this.cart.items.map((product) => product.productId);
  this.cart.items.forEach(
    (product) => (modifiedProducts[product.productId] = product.quantity)
  );
  return Product.find({ _id: { $in: productsIds } })
    .then((prods) => {
      return prods.map((prod) => {
        prod.quantity = modifiedProducts[prod._id];
        return prod;
      });
    })
    .then((products) => {
      const cartProducts = products.map((prod) => {
        const cartProduct = { productId: prod._id, quantity: prod.quantity };
        return cartProduct;
      });
      returnedProducts = cartProducts;
      return products;
    })
    .then((products) => {
      lastProducts = products;
      this.cart.items = [...returnedProducts];
      return this.save();
    })
    .then(() => {
      return lastProducts;
    })
    .catch((err) => console.log(err));
};

userSchema.methods.removeFromCart = function (id) {
  const updatedCartItems = this.cart.items.filter(
    (item) => item.productId.toString() !== id.toString()
  );
  this.cart.items = [...updatedCartItems];
  return this.save();
};

userSchema.methods.addOrder = function () {
  const productsIds = this.cart.items.map((product) => product.productId);
  let tempArr = [];
  this.cart.items.forEach((item) => {
    tempArr[item.productId] = item.quantity;
  });
  return Product.find({ _id: { $in: productsIds } })
    .then((cartProducts) => {
      return cartProducts.map((cartProduct) => {
        const orderProduct = {
          productId: cartProduct._id,
          title: cartProduct.title,
          price: +cartProduct.price,
          quantity: tempArr[cartProduct._id],
        };
        return orderProduct;
      });
    })
    .then((orderProducts) => {
      const orderObject = { user: {}, orderItems: { items: [] } };
      orderObject.orderItems.items = [...orderProducts];
      orderObject.user = {
        userId: this._id,
        email: this.email,
      };
      const order = new Order(orderObject);
      //   console.log("order: ", order);
      return order.save();
    })
    .then(() => {
      this.cart.items = [];
      return this.save();
    })
    .then((result) => {})
    .catch((err) => console.log(err));
};

userSchema.methods.getOrders = function () {
  return Order.find({ "user.userId": this._id });
};

module.exports = mongoose.model("User", userSchema);
