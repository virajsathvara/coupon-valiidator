const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

router.get('/:id', function (req, res, next) {
  const productsCollection = req.app.db.collection('products');
  productsCollection.findOne({ _id: ObjectId(req.params.id) })
    .then(result => {
      req.session.product = { name: result.name, finalPrice: 0 };
      res.render('cart', { product: result, discountedPrice: 0 });
    })
    .catch(error => console.error(error));
});

router.get('/:id/:code', function (req, res, next) {
  const productsCollection = req.app.db.collection('products');
  let discount;
  productsCollection.findOne({ _id: ObjectId(req.params.id) })
    .then(result => {
      if (req.session.product && (result.name == req.session.product.name)) {
        discount = req.session.product.finalPrice ? req.session.product.finalPrice : 0;
      }
      else {
        req.session.product = { name: result.name, finalPrice: 0 };
      }
      res.render('cart', { product: result, discountedPrice: discount });
    })
    .catch(error => console.error(error));
});

module.exports = router;