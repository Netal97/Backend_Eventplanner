const jwtModule = require('./secretkey');

const verifyToken = (req, res, next) => {
    const auth = req.headers.authorization;

    if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split('Bearer ')[1];
        //console.log(token);

        if (!token) {
            return res.status(401).json({ 
                error: 'Unauthorized - No token provided',
                success: 'no'
             });
        }

        const decodedToken = jwtModule.verifyJwtToken(token);

        if (!decodedToken) {
            return res.status(401).json({ 
                error: 'Unauthorized - Invalid token',
                success: 'no'
             });
        }

        req.decodedToken = decodedToken;

        next();
    } else {
        //console.log(auth);
        return res.status(401).json({ 
            error: 'Unauthorized - Missing or invalid token format',
            success: 'no'
         });
    }
};

module.exports = verifyToken;