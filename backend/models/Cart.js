const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  variant: { type: String, default: '' },
});

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    coupon: { type: String, default: '' },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.methods.recalculate = function () {
  const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  this.totalPrice = Math.max(0, subtotal - this.discount);
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);
