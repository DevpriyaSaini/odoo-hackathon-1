const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const {
    signup,
    signin,
    verifyEmail,
    getMe,
    resendVerification,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// Validation middleware
const validateSignup = [
    body('employeeId')
        .trim()
        .notEmpty().withMessage('Employee ID is required')
        .isLength({ min: 3 }).withMessage('Employee ID must be at least 3 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain a number'),
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['Employee', 'HR']).withMessage('Role must be Employee or HR')
];

const validateSignin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

const validatePassword = [
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain a number')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Routes
router.post('/signup', validateSignup, handleValidationErrors, signup);
router.post('/signin', validateSignin, handleValidationErrors, signin);
router.get('/verify/:token', verifyEmail);
router.get('/me', protect, getMe);
router.post('/resend-verification', protect, resendVerification);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', validatePassword, handleValidationErrors, resetPassword);

module.exports = router;
