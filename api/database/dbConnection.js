const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'webapp_eventplanner',
});

db.connect((err) => {
    if (err) {
        console.error('Fehler bei der Verbindung zu MySQL', err);
    } else {
        console.log('Mit der MySQL-Datenbank verbunden');
    }
});


module.exports = db;
