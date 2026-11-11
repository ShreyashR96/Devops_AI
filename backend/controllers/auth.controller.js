import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env?.JWT_SECRET ?? 'super_secret_flasho_key_change_me_in_production';

export const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ email, password });
        await user.save();

        const token = jwt.sign({ id: user?._id, role: user?.role }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ token, user: { email: user?.email, role: user?.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: error?.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user?._id, role: user?.role }, JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ token, user: { email: user?.email, role: user?.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error?.message });
    }
};