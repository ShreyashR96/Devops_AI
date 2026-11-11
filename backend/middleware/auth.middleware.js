import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env?.JWT_SECRET ?? 'super_secret_flasho_key_change_me_in_production';

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers?.authorization;
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No valid token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = decoded; // Attach user payload to request
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};