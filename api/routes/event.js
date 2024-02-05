const express = require('express');
const router = express.Router();
const db = require('../database/dbConnection');
const verifyToken = require('../key/verifytoken');



//function 1: Verfügbare Events auflisten


router.get('/', (req, res, next) => {
    db.query('SELECT users.UserName, events.EventID, events.UserID, events.Eventname, events.createDate, events.EventDate, events.Starttime, events.Endtime, events.Eventstatus, events.Description FROM events INNER JOIN users ON events.UserID = users.UserID', (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            next(err); 
        } else {
            res.status(200).json({
                message: 'Events werden aufgelistet',
                results: results
            });
        }
    });
});



// function 2:  Abrufen eines Events nach ID


router.get('/:eventId', (req, res, next) => {
    const eventId = req.params.eventId;

    db.query('SELECT events.*, users.UserName FROM events INNER JOIN users ON events.UserID = users.UserID WHERE EventID = ?', [eventId], (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            next(err);
        } else if (results.length === 0) {
            res.status(404).json({ 
                message: 'Event nicht gefunden',
                success: 'no'
             });
        } else {
            res.status(200).json({
                message: 'Event erfolgreich abgerufen',
                success:'yes',
                results: results[0]
            });
        }
    });
});



// function 3: Ein Event erstellen


router.post('/', verifyToken, (req, res, next) => {
    const event = {
        UserID: req.body.userId,
        EventName: req.body.eventname,
        createDate: req.body.createDate,
        EventDate: req.body.eventDate,
        Starttime: req.body.startTime,
        Endtime: req.body.endTime,
        Eventstatus: req.body.eventStatus,
        Description: req.body.description
    };

    db.query('INSERT INTO events SET ?', event, function (error, result) {
        if (error) {
            return res.status(500).json({ error: 'Internal Server Error - Event Insert', details: error });
        }

        db.query('SELECT MAX(EventID) AS lastId FROM events', function (error, result) {
            if (error) {
                return res.status(500).json({ error: 'Internal Server Error - Select Last ID', details: error });
            }

            const lastId = result[0].lastId || 1; 

            const participant = {
                EventID: lastId,
                UserID: req.body.userId,
                Role: 'Trainer'
            };


            db.query('INSERT INTO participate SET ?', participant, function (error, result) {
                if (error) {
                    return res.status(500).json({
                        error: 'Internal Server Error - Participant Insert',
                        details: error,
                        success: 'no',
                        participant: participant
                    });
                }

                console.log(result);
                res.status(200).json({
                    message: 'Event erfolgreich erstellt',
                    success: 'yes',
                    eventId: lastId
                });
            });
        });
    });
});


// function 4: Ein Event löschen 


const deleteEventAndParticipations = (eventId, callback) => {
    db.beginTransaction((err) => {
        if (err) {
            callback(err, null);
            return;
        }

        db.query('DELETE FROM participate WHERE EventID = ?', [eventId], (error, results) => {
            if (error) {
                db.rollback(() => {
                    callback(error, null);
                });
            } else {
                db.query('DELETE FROM events WHERE EventID = ?', [eventId], (err, results) => {
                    if (err) {
                        db.rollback(() => {
                            callback(err, null);
                        });
                    } else {
                        db.commit((err) => {
                            if (err) {
                                db.rollback(() => {
                                    callback(err, null);
                                });
                            } else {
                                callback(null, results.affectedRows > 0); 
                            }
                        });
                    }
                });
            }
        });
    });
};



router.delete('/remove/:eventId', verifyToken, (req, res, next) => {
    const eventId = req.params.eventId;

    deleteEventAndParticipations(eventId, (err, success) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (success) {
                res.status(200).json({
                    message: 'Event und zugehörige Teilnahmen erfolgreich gelöscht',
                    eventId: eventId
                });
            } else {
                res.status(404).json({
                    error: 'Event not found'
                });
            }
        }
    });
});




// function 5: Ein Event bearbeiten


router.put('/update/:eventId', verifyToken, (req, res, next) => {
    const eventId = req.params.eventId;

    const updatedEvent = {
        EventName: req.body.eventname,
        EventDate: req.body.eventDate,
        Starttime: req.body.startTime,
        Endtime: req.body.endTime,
        Eventstatus: req.body.eventStatus,
        Description: req.body.description
    };

    db.query('UPDATE events SET ? WHERE EventID = ?', [updatedEvent, eventId], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.affectedRows === 0) {
            res.status(404).json({ error: 'Event not found', success:'no' });
        } else {
            res.status(200).json({ 
                message: 'Event wurde erfolgreich aktualisiert',
                success: 'yes',
                eventId: eventId
             });
        }
    });
});



// function 6: Abrufen von Events eines bestimmten Users


router.get('/users/:userId', verifyToken, (req, res, next) => {
    const userId = req.params.userId;

    db.query('SELECT events.*, users.UserName FROM events INNER JOIN users ON events.UserID = users.UserID WHERE events.UserID = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            next(err);
        } else {
            res.status(200).json({
                message: 'Events für '+ userId +' erfolgreich abgerufen',
                results: results
            });
        }
    });
});


// function 7: Aktuelle Events abrufen


router.get('/status/ongoing', (req, res, next) => {
    db.query('SELECT * FROM events WHERE Eventstatus = "offen"', (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            next(err);
        } else {
            res.status(200).json({
                message: 'Laufende Events erfolgreich abgerufen',
                results: results
            });
        }
    });
});



// function 8: Abrufen von geplanten Events für ein bestimmtes Datum


router.get('/date/:eventDate', (req, res, next) => {
    const eventDate = req.params.eventDate;

    db.query('SELECT * FROM events WHERE EventDate = ?', [eventDate], (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            next(err);
        } else {
            if (results.length === 0) {
                res.status(404).json({
                    message: 'Für das angegebene Datum wurden keine Events gefunden',
                    results: []
                });
            }else {
                res.status(200).json({
                    message: 'Events zu Datum erfolgreich abgerufen',
                    results: results
                });
            }
        }
    });
});



module.exports = router;