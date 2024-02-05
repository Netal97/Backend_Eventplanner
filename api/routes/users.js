const express = require('express');
const router = express.Router();
const db = require('../database/dbConnection');
const bcrypt = require('bcrypt');
const jwt = require('../key/secretkey');
const verifyToken = require('../key/verifytoken');


// function 1: registrierung

const hashPassword = (password, callback) => {
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, hash);
        }
    });
};


router.post('/signup', (req, res, next) => {
    const { username, email, password } = req.body;

    // Check if the email already exists in the database
    db.query('SELECT * FROM users WHERE Email = ?', [email], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.length > 0) {
            res.status(409).json({ 
                message: 'E-Mail existiert bereits',
                success: 'no'
             });
        } else {
            // Hash the password before saving it to the database
            hashPassword(password, (err, hashedPassword) => {
                if (err) {
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }

                const user = {
                    UserName: username,
                    Email: email,
                    Password: hashedPassword
                };

                db.query('INSERT INTO users SET ?', user, (insertError, insertResults) => {
                    if (insertError) {
                        res.status(500).json({ error: 'Internal Server Error' });
                    } else {
                        res.status(200).json({
                            message: 'Benutzer erfolgreich registriert',
                            success: 'yes',
                            userId: insertResults.insertId
                        });
                    }
                });
            });
        }
    });
});



// function 2: Login




router.post('/login', (req, res, next) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE Email = ?', [email], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.length === 0) {
            res.status(401).json({ 
                message: 'Ungültige Anmeldedaten',
                success: 'no' 
            });
        } else {
            const user = results[0];

            bcrypt.compare(password, user.Password, (err, passwordMatch) => {
                if (err || !passwordMatch) {
                    res.status(401).json({ 
                        message: 'Ungültige Anmeldedaten',
                        success: 'no'
                     });
                } else {

                    const token = jwt.generateJwtToken( {userId: user.UserID}, { expiresIn: '1h' });
                    res.header('Authorization', `Bearer ${token}`);                    

                    res.status(200).json({
                        message: 'Login erfolgreich',
                        success: 'yes',
                        token: token,
                        userId: user.UserID
                    });
                }
            });
        }
    });
});



//function 3: Get Users Information

router.get('/:userId', verifyToken, (req, res, next) => {
    const userId = req.params.userId;

    db.query('SELECT UserName, Email, Password FROM users WHERE UserID = ?', userId, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.length === 0) {
            return res.status(404).json({ 
                error: 'User nicht gefunden',
                success: 'no'
             });
        } else {
            const userInformation = {
                username: results[0].UserName,
                email: results[0].Email
            };
            return res.status(200).json({
                message: 'user gefunden',
                success:'yes',
                userInformation: userInformation
            });
        }
    });
});



// function 3: Update User Daten


router.put('/edit/:userId', verifyToken, (req, res, next) => {

    const userId = req.params.userId;
    const { username, email } = req.body;

    const updatedUser = {
        UserName: username,
        Email: email,
    };

    db.query('UPDATE users SET ? WHERE UserID = ?', [updatedUser, userId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        } else {
            return res.status(200).json({
                message: 'Benutzer erfolgreich aktualisiert',
                userId: userId
            });
        }
    });
});




module.exports = router;