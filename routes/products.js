const express = require('express');
const router = express.Router();

/* GET products. */
router.get('/', function (req, res, next) {
  const productsCollection = req.app.db.collection('products');
  productsCollection.find().toArray()
    .then(result => {
      //res.send(result);
      console.log(result);
      res.render('products', { products: result });
    })
    .catch(error => res.send(error));
});

/* POST products. */
router.post('/', function (req, res, next) {
  const productsCollection = req.app.db.collection('products');
  productsCollection.insertOne(req.body)
    .then(result => {
      console.log(result);
      res.redirect('/');
    })
    .catch(error => res.send(error));
});

module.exports = router;
