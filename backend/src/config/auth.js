'use strict';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.trim().length === 0) {
        throw new Error('JWT_SECRET is required');
    }

    return secret;
};

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

module.exports = {
    getJwtSecret,
    getJwtExpiresIn
};
