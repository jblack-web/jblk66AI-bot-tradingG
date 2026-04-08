'use strict';

const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('referralCode').optional().isString().trim(),
  handleValidationErrors
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  handleValidationErrors
];

const tradeValidation = [
  body('asset').trim().notEmpty().withMessage('Asset is required').toUpperCase(),
  body('direction').isIn(['buy', 'sell']).withMessage('Direction must be buy or sell'),
  body('quantity').isFloat({ min: 0.0001 }).withMessage('Quantity must be positive'),
  body('entryPrice').optional().isFloat({ min: 0 }).withMessage('Entry price must be positive'),
  handleValidationErrors
];

const depositValidation = [
  body('amount').isFloat({ min: 10 }).withMessage('Minimum deposit is $10'),
  body('method').isIn(['stripe', 'bank_transfer', 'crypto', 'wire', 'paypal', 'card']).withMessage('Invalid payment method'),
  body('promoCode').optional().isString().trim().toUpperCase(),
  handleValidationErrors
];

const withdrawalValidation = [
  body('amount').isFloat({ min: 10 }).withMessage('Minimum withdrawal is $10'),
  body('method').isIn(['bank_transfer', 'crypto', 'wire', 'paypal', 'card']).withMessage('Invalid withdrawal method'),
  body('destinationDetails').isObject().withMessage('Destination details required'),
  handleValidationErrors
];

const promoCodeValidation = [
  body('code').trim().notEmpty().withMessage('Code is required').toUpperCase().isLength({ max: 20 }),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be positive'),
  body('maxUses').isInt({ min: 1 }).withMessage('Max uses must be at least 1'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date required'),
  handleValidationErrors
];

const optionsValidation = [
  body('asset').trim().notEmpty().toUpperCase(),
  body('optionType').isIn(['call', 'put']).withMessage('Option type must be call or put'),
  body('strikePrice').isFloat({ min: 0 }).withMessage('Strike price must be positive'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date required'),
  handleValidationErrors
];

const futuresValidation = [
  body('asset').trim().notEmpty().toUpperCase(),
  body('direction').isIn(['long', 'short']).withMessage('Direction must be long or short'),
  body('size').isFloat({ min: 0.001 }).withMessage('Size must be positive'),
  body('leverage').isInt({ min: 1, max: 20 }).withMessage('Leverage must be between 1 and 20'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  tradeValidation,
  depositValidation,
  withdrawalValidation,
  promoCodeValidation,
  optionsValidation,
  futuresValidation,
  handleValidationErrors
};
