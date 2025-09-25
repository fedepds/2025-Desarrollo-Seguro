import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwtUtils from '../utils/jwt'; // usar util centralizada

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwtUtils.verifyToken(token) as any;
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

export default authenticateJWT;
