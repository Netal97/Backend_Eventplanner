const express = require('express');
const router = express.Router();
const db = require('../database/dbConnection');
const verifyToken = require('../key/verifytoken');



// function 1: Teilnehmer eines Events auflisten

const listEventParticipants = (eventId, callback) => {
    const query = `
        SELECT participate.UserID, participate.eventID, users.UserName, events.EventName, participate.Role
        FROM participate
        INNER JOIN events ON participate.EventID = events.EventID
        INNER JOIN users ON participate.UserID = users.UserID
        WHERE participate.EventID = ? AND participate.Role = "Teilnehmer";
    `;

    db.query(query, [eventId], (error, results) => {
        if (error) {
            console.error('Error executing query: ', error);
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
};


router.get('/events/:eventId', verifyToken, (req, res, next) => {
    const eventId = req.params.eventId;

    listEventParticipants(eventId, (err, participants) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({
                message: 'Event participants retrieved successfully',
                participants: participants
            });
        }
    });
});



// function 2: Teilnehmer hinzufugen mit role teilnehmer


router.post('/:userId/:eventId', verifyToken, (req, res, next) => {
    const userId = req.params.userId;
    const eventId = req.params.eventId;


    const checkQuery = 'SELECT * FROM participate WHERE UserID = ? AND EventID = ?';
    db.query(checkQuery, [userId, eventId], (checkError, checkResults) => {
        if (checkError) {
            console.error('Error checking participation status:', checkError);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (checkResults.length > 0) {

                res.status(400).json({ error: 'Already Participated', message: 'Sie sind schon an diesem Event ein Teilnehmer.' });
            } else {


                const roleQuery = 'SELECT Role FROM participate WHERE EventID = ? AND UserID = ?';
                db.query(roleQuery, [eventId, userId], (roleError, roleResults) => {
                    if (roleError) {
                        console.error('Error checking user role:', roleError);
                        res.status(500).json({ error: 'Internal Server Error' });
                    } else {
                        const userRole = roleResults.length > 0 ? roleResults[0].Role : null;
                        if (userRole === 'Trainer') {
                            res.status(400).json({ error: 'Trainer Cannot Participate', message: 'Ein Trainer kann nicht als Teilnehmer teilnehmen.' });
                        } else {
                        

                            const insertQuery = 'INSERT INTO participate SET ?';
                            const participant = { UserID: userId, EventID: eventId, Role: 'Teilnehmer' };

                            db.query(insertQuery, participant, (insertError, insertResults) => {
                                if (insertError) {
                                    console.error('Error inserting participant:', insertError);
                                    res.status(500).json({ error: 'Internal Server Error' });
                                } else {
                                    res.status(200).json({ message: 'Teilnahme erfolgreich hinzugefügt' });
                                }
                            });
                        }
                    }
                });
            }
        }
    });
});

// function 3: Seine Teilnahme als role teilnehmer löschen


const removeParticipantFromEvent = (userId, eventId, callback) => {
    db.query('DELETE FROM participate WHERE UserID = ? AND EventID = ? AND Role = "Teilnehmer"', [userId, eventId], (error, results) => {
        if (error) {
            console.error('Error executing query: ', error);
            callback(error, null);
        } else {
            callback(null, results.affectedRows > 0);
        }
    });
};


router.delete('/remove/:userId/:eventId', verifyToken, (req, res, next) => {
    const userId = req.params.userId;
    const eventId = req.params.eventId;

    removeParticipantFromEvent(userId, eventId, (err, success) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (success) {
                res.status(200).json({
                    message: 'Teilnahme wurde erfolgreich entfernt'
                });
            } else {
                res.status(404).json({
                    error: 'Teilnahme für den angegebenen Benutzer und das Event nicht gefunden'
                });
            }
        }
    });
});


// Funktion 4: Liste der Veranstaltungen, an denen der Nutzer als "Teilnehmer" teilnimmt

const listUserParticipatedEvents = (userId, callback) => {
    const query = `
        SELECT events.*
        FROM participate
        INNER JOIN events ON participate.EventID = events.EventID
        WHERE participate.UserID = ? AND participate.Role = 'Teilnehmer';
    `;

    db.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error executing query: ', error);
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
};

router.get('/users/:userId', verifyToken, (req, res, next) => {
    const userId = req.params.userId;

    listUserParticipatedEvents(userId, (err, participatedEvents) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({
                message: 'Liste der Events',
                results: participatedEvents
            });
        }
    });
});

module.exports = router;