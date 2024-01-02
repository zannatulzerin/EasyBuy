const Product = require('../models/Product');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

//home
exports.homepage = async (req, res) => {
  try {
    let userId = await req.session.userId;
    let userName = await req.session.username;

    const limitNumber = 5;
    const latest = await Product.find({}).sort({ _id: -1 }).limit(limitNumber);

    const food = { latest };
    res.render('index', { food, userId, userName });
  } catch (error) {
    res.status(500).send({ message: error.message || 'Error Occured' });
  }
};

//get a product
exports.exploreProducts = async (req, res) => {
  try {
    let productId = req.params.id;
    const product = await Product.findById(productId);
    res.render('product', { product: product });
  } catch (err) {
    res.status(500).send({ message: err.message || 'Error Occured' });
  }
};

//view all products
exports.allProducts = async (req, res) => {
  try {
    const products = await Product.find({});

    res.render('allproducts', { products });
  } catch (err) {
    res.status(500).send({ message: err.message || 'Error Occured' });
  }
};

exports.submitProduct = async (req, res) => {
  try {
    const infoErrorsObj = req.flash('infoErrors');
    const infoSubmitObj = req.flash('infoSubmit');
    res.render('submit-product', { infoErrorsObj, infoSubmitObj });
  } catch (err) {
    res.status(500).send({ message: err.message || 'Error Occured' });
  }
};

exports.submitProductPost = async (req, res) => {
  try {
    let imageUploadFile;
    let uploadPath;
    let newImageName;

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('No File was uploaded.');
    } else {
      imageUploadFile = req.files.image;
      newImageName = Date.now() + imageUploadFile.name;

      uploadPath =
        require('path').resolve('./') + '/public/uploads/' + newImageName;

      imageUploadFile.mv(uploadPath, function (err) {
        if (err) {
          console.error('Error while uploading:', err);
          return res.status(500).send(err);
        }
        console.log('File uploaded successfully.');
      });
    }

    console.log('Before creating new product instance.');

    const newProduct = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      countInStock: req.body.countInStock,
      category: req.body.category,
      image: newImageName,
      user: req.session.userId,
    });

    console.log('New product instance created:', newProduct);

    await newProduct.save();

    console.log('Product saved successfully.');

    req.flash('infoSubmit', 'Product has been added.');
    res.redirect('/submit-product');
  } catch (error) {
    console.error('Error while submitting product:', error);
    req.flash('infoErrors', error.message);
    res.redirect('/submit-product');
  }
};

const { v4: uuidv4 } = require('uuid');

exports.signupPost = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the user already exists by email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      req.flash('infoErrors', 'User already registered');
      return res.redirect('/signin');
    }

    // Generate a random ID for googleId
    const googleId = uuidv4();

    // Create a new user instance
    const hash_password = await bcrypt.hash(password, 10);
    const _user = new User({
      name,
      email,
      hash_password: hash_password,
      googleId, // Assign the generated Google ID
      // ... other fields
    });

    await _user.save();

    req.flash('infoSubmit', 'Registered Successfully');
    res.redirect('/signin');
  } catch (error) {
    // Handle error appropriately, e.g., log it or redirect to an error page
    console.error(error);
    req.flash('infoErrors', 'Error occurred during signup');
    res.redirect('/signin');
  }
};

exports.signUp = async (req, res) => {
  try {
    const infoErrorsObj = req.flash('infoErrors');
    const infoSubmitObj = req.flash('infoSubmit');
    res.render('signup', { infoErrorsObj, infoSubmitObj });
  } catch (err) {
    res.status(500).send({ message: err.message || 'Error Occured' });
  }
};

exports.signIn = async (req, res) => {
  try {
    const infoErrorsObj = req.flash('infoErrors');
    const infoSubmitObj = req.flash('infoSubmit');
    res.render('signin', { infoErrorsObj, infoSubmitObj });
  } catch (err) {
    res.status(500).send({ message: err.message || 'Error Occured' });
  }
};

exports.signinPost = async (req, res) => {
  try {
    if (req.user && req.user.googleId) {
      req.session.userId = req.user._id;
      req.session.username = req.user.name;
      req.session.userLoggedIn = true;
      return res.redirect('/');
    }

    await User.findOne({ email: req.body.email }).exec(async (error, user) => {
      if (error) {
        req.flash('infoErrors', error);
        return res.redirect('/signin');
      }

      if (user) {
        const isPassword = await user.authenticate(req.body.password);
        if (isPassword) {
          req.session.userId = user._id;
          req.session.username = user.name;
          req.session.userLoggedIn = true;
          return res.redirect('/');
        } else {
          req.flash('infoErrors', 'Email or Password is incorrect');
          return res.redirect('/signin');
        }
      } else {
        req.flash('infoErrors', 'User does not exist');
        return res.redirect('/signin');
      }
    });
  } catch (error) {
    req.flash('infoErrors', error);
    res.redirect('/signin');
  }
};

exports.userProfile = (req, res) => {
  try {
    let count = 0;
    User.findOne({ _id: req.session.userId }).exec(async (error, user) => {
      if (error) console.log(error);
      if (user) {
        let product = await Product.find({ user: ObjectId(user._id) });
        if (product) {
          count = product.length;
        }
        res.render('userProfile', { user, count, product });
      } else {
        console.log(error);
      }
    });
  } catch (error) {
    console.log(error);
    req.flash('infoErrors', error);
  }
};

exports.editProducts = async (req, res) => {
  const product_id = req.params.id;
  const productItem = await Product.find({ _id: ObjectId(product_id) });
  let imageUploadFile;
  let uploadPath;
  let newImageName;

  if (!req.files || Object.keys(req.files).length === 0) {
    console.log('No File was uploaded.');
  } else {
    imageUploadFile = req.files.image;
    newImageName = Date.now() + imageUploadFile.name;

    uploadPath =
      require('path').resolve('./') + '/public/uploads/' + newImageName;

    imageUploadFile.mv(uploadPath, function (err) {
      if (err) return res.satus(500).send(err);
    });
  }

  // if (req.body.ingredients) {
  //   ingredientsArray = req.body.ingredients.split(',');
  // }
  // console.log(ingredientsArray);

  await Product.findByIdAndUpdate(
    { _id: ObjectId(product_id) },

    {
      name: req.body.name ? req.body.name : productItem[0].name,
      description: req.body.description
        ? req.body.description
        : productItem[0].description,
      price: req.body.price ? req.body.price : productItem[0].price,
      countInStock: req.body.countInStock
        ? req.body.countInStock
        : productItem[0].countInStock,
      category: req.body.category ? req.body.category : productItem[0].category,
      image: newImageName ? newImageName : productItem[0].image,
    },
    { new: true }
  );
  res.redirect('/profile');
};

exports.deleteProduct = async (req, res) => {
  let id = req.params.id;

  await Product.deleteOne({ _id: ObjectId(id) }).then((response) => {
    res.json({ status: true });
  });
};

//reset pass
const sendResetPasswordEmail = async (userEmail, resetToken) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'german.koepp28@ethereal.email',
      pass: 'QCpDeAs1PadcbVxFNS',
    },
  });

  const mailOptions = {
    from: 'german.koepp28@ethereal.email',
    to: userEmail,
    subject: 'Password Reset Request',
    text: `Token:\n` + `${resetToken}\n\n`,
  };

  await transporter.sendMail(mailOptions);
};

exports.renderForgotPasswordPage = (req, res) => {
  res.render('forgot-password');
};

let userEmail = '';

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    userEmail = email;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render('forgot-password', { message: 'Email not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await sendResetPasswordEmail(email, token);

    res.render('reset-token', { token });
  } catch (error) {
    res.status(500).send({ message: error.message || 'Error Occurred' });
  }
};

exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (user) {
      return res.render('reset-password', { token });
    } else {
      return res.render('reset-token', {
        message: 'Invalid or expired token or token does not exist',
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message || 'Error Occurred' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const email = userEmail;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render('reset-password', { message: 'Invalid email' });
    }

    if (newPassword !== confirmPassword) {
      return res.render('reset-password', {
        message: 'Passwords do not match',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.hash_password = hashedPassword;
    await user.save();

    userEmail = '';
    return res.redirect('/signin');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message || 'Error Occurred' });
  }
};

exports.renderResetTokenPage = (req, res) => {
  res.render('reset-token');
};

exports.renderResetPasswordPage = (req, res) => {
  const { token } = req.params;
  res.render('reset-password', { token });
};
