const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector("[name=id]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
  const productElement = btn.closest("article");
  fetch("/admin/product/" + productId, {
    method: "DELETE",
    headers: {
      "csrf-token": csrf,
    },
  })
    .then((result) => {
      productElement.parentNode.removeChild(productElement);
      return result.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
    });
};
