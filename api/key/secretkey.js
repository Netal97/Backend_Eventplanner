const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateSecretKey = () => {
    return crypto.randomBytes(32).toString('hex'); 
};

const createJwtModule = () => {
    const secretKey = process.env.JWT_SECRET || generateSecretKey();

    const generateJwtToken = (payload, options) => {
        return jwt.sign(payload, secretKey, options);
    };

    const verifyJwtToken = (token) => {
        try {
            return jwt.verify(token, secretKey);
        } catch (error) {
            return null;
        }
    };

    return {
        generateJwtToken,
        verifyJwtToken
    };
};

module.exports = createJwtModule();