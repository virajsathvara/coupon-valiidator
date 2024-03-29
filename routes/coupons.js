const express = require('express');
const router = express.Router();
const Joi = require('joi');


/* EDIT coupons. */
router.get('/edit', function (req, res, next) {
  res.render('addcoupon', { data: req.body, edit: true });
});

/* NEW coupons. */
router.get('/new', function (req, res, next) {
  res.render('addcoupon', { edit: false });
});

/* GET coupon. */
router.get('/:code', function (req, res, next) {
  const couponsCollection = req.app.db.collection('coupons');
  console.log('params: ', req.params.code);
  couponsCollection.findOne({ name: req.params.code })
    .then(result => {
      console.log('found Coupon: ', result);
      res.send(result);
    })
    .catch(error => res.send(error));
});

/* GET coupons. */
router.get('/', function (req, res, next) {
  const couponsCollection = req.app.db.collection('coupons');
  couponsCollection.find().toArray()
    .then(result => {
      //res.send(result);
      res.render('coupons', { coupons: result });
    })
    .catch(error => res.redirect('404', { error }));
});

/* Validate coupons. */
router.post('/validate', function (req, res, next) {
  console.log(req.body);
  const couponsCollection = req.app.db.collection('coupons');
  const schema = Joi.object().keys({
    code: Joi.string().alphanum().min(3).max(30).required(),
    price: Joi.required(),
    id: Joi.required(),
    name: Joi.required(),
  });
  const { value, error } = schema.validate(req.body);
  if (error) {
    /* res.render('404', {
      error: 'Invalid request'
    }); */
    console.log(req.session, error);
    req.session.product.finalPrice = -1;
    res.redirect(`/cart/${req.body.id}/invalidCode`);
  } else {
    const date = new Date();
    couponsCollection.findOne({ name: req.body.code })
      .then(result => {
        let finalPrice = req.body.price;
        let discount;
        console.log("coupon is: ", result);
        if (req.body.price >= result.minCartValue &&
          date >= new Date(result.startDate) &&
          date <= new Date(result.endDate)) {
          if (result.flatDiscount > 0)
            discount = result.flatDiscount;
          if (result.percentageDiscount > 0) {
            console.log('final discount: ', finalPrice * result.percentageDiscount / 100);
            discount = finalPrice * result.percentageDiscount / 100;
          }
          try {
            if (req.session.product.name === req.body.name)
              req.session.product.finalPrice = discount;
          } catch (error) {
            res.render('404', { error: 'session expired' });
          }


          res.redirect(`/cart/${req.body.id}/${result.name}`);
        }
        else {
          req.session.product.finalPrice = -1;
          res.redirect(`/cart/${req.body.id}/${result.name}`);
        }
      })
      .catch(error => {
        req.session.product.finalPrice = -1;
        res.redirect(`/cart/${req.body.id}/${req.body.code}`);
      });
  }
});


/* DELETE coupons. */
router.post('/delete', function (req, res, next) {
  const couponsCollection = req.app.db.collection('coupons');
  couponsCollection.deleteOne({ name: req.body.name })
    .then(result => {
      //res.send(result);
      res.redirect('/coupons');
    })
    .catch(error => res.redirect('404'));
});

/* ADD new coupon */
router.post('/', function (req, res, next) {
  console.log(req.body);
  const couponsCollection = req.app.db.collection('coupons');
  const schema = Joi.object().keys({
    name: Joi.string().alphanum().min(4).max(6).required().error(new Error('Coupon Code should be of 3 to 6 characters.')),
    minCartValue: Joi.number().required().error(new Error('Minimum Cart Value should be a valid number.')),
    startDate: Joi.date().iso().required().error(new Error('Start Date should not be empty.')),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().error(new Error('End Date should fall after the start date and not empty.')),
    flatDiscount: Joi.number().required().error(new Error('Flat Discount should be a valid number.')),
    percentageDiscount: Joi.number().min(0).max(100).required().error(new Error('Percentage Discount should be a valid number between 0 to 100.')),
  });

  const { value, error } = schema.validate(req.body);
  if (error) {
    /* res.render('404', {
      error: 'Invalid request'
    }); */
    console.log("error====================", error);
    if (req.session.product)
      req.session.product.finalPrice = -1;
    res.render(`addcoupon`, { message: error, data: req.body });
  } else {
    const couponToBeAdded = {
      name: req.body.name,
      minCartValue: parseInt(req.body.minCartValue),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      flatDiscount: parseInt(req.body.flatDiscount),
      percentageDiscount: parseInt(req.body.percentageDiscount),
    };
    //couponToBeAdded.flatDisApplicable = (couponToBeAdded.flatDiscount > 0);
    //couponToBeAdded.percentageDisApplicable = (couponToBeAdded.percentageDiscount > 0);

    console.log('final item: ', couponToBeAdded);

    couponsCollection.insertOne(couponToBeAdded)
      .then(result => {
        console.log(result);
        res.redirect(`/coupons`);
      })
      .catch(error => {
        res.redirect(`/404`);
      });
  }
});

module.exports = router;
