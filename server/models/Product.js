const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    countInStock: {
      type: Number,
      required: false,
    },
    category: {
      type: String,
      enum: ['Shirts', 'Pants', 'Shoes', 'Hats', 'Watches', 'Genji'],
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    user: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
