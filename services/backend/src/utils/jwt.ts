import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    throw new Error('JWT secret is not set in process.env.JWT_SECRET');
}

const generateToken = (userId: string) => {
    return jwt.sign(
        { id: userId },
        SECRET,
        { expiresIn: '1h', issuer: 'mi-app', algorithm: 'HS256' }
    );
};

const verifyToken = (token: string) => {
    return jwt.verify(token, SECRET, { issuer: 'mi-app', algorithms: ['HS256'] });
};

export default {
    generateToken,
    verifyToken
}
