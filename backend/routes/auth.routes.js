import express from 'express';
import { login, register } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Example of a protected route check
router.get('/verify', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Token is valid', user: req?.user });
});

export default router;