/**
 * 認証ルート
 */
const express = require('express');
const authController = require('../../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
