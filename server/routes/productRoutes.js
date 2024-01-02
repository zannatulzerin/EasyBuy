const express = require('express');
const productRouter = express.Router();
const productController = require('../controllers/productController');
const passport = require('../../Middleware/passport');

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next();
  } else {
    res.redirect('/signin');
  }
};

productRouter.get('/', productController.homepage);

productRouter.get('/product/:id', productController.exploreProducts);

productRouter.get(
  '/submit-product',
  verifyLogin,
  productController.submitProduct
);
productRouter.post(
  '/submit-product',
  verifyLogin,
  productController.submitProductPost
);

productRouter.post('/signup', productController.signupPost);
productRouter.get('/signup', productController.signUp);

productRouter.get('/signin', productController.signIn);
productRouter.post('/signin', productController.signinPost);

productRouter.get('/allproducts', productController.allProducts);

productRouter.get('/profile', verifyLogin, productController.userProfile);

productRouter.get('/editList/:id', verifyLogin, (req, res) =>
  res.redirect('/profile')
);
productRouter.post(
  '/editList/:id',
  verifyLogin,
  productController.editProducts
);

productRouter.delete(
  '/deleteList/:id',
  verifyLogin,
  productController.deleteProduct
);

// Routes for Google authentication
productRouter.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

productRouter.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin' }),
  async (req, res) => {
    try {
      if (req.user) {
        req.session.userId = req.user._id;
        req.session.username = req.user.name;
        req.session.userLoggedIn = true;

        res.redirect('/');
      } else {
        res.redirect('/signin');
      }
    } catch (error) {
      console.error(error);
      res.redirect('/signin');
    }
  }
);

productRouter.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

productRouter.get(
  '/forgot-password',
  productController.renderForgotPasswordPage
);
productRouter.post('/forgot-password', productController.forgotPassword);

productRouter.get('/reset-token', productController.renderResetTokenPage);
productRouter.post(
  '/validate-reset-token',
  productController.validateResetToken
);

productRouter.get(
  '/reset-password/:token',
  productController.renderResetPasswordPage
);
productRouter.post('/reset-password', productController.resetPassword);

module.exports = productRouter;
