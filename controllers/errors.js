exports.get404 = (req, res, next) => {
  res.render("404", {
    pageTitle: "404 Page",
    path: null,
  });
};

exports.get500 = (req, res, next) => {
  res.render("500", {
    pageTitle: "500 Page",
    path: "/500",
  });
};
