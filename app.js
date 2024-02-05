const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const app = express();


app.use(morgan('dev'));
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//Events call
const eventsRoutes = require('./api/routes/event');

//Participants call
const participantsRoutes = require('./api/routes/participants');

//Users call
const usersRoutes = require('./api/routes/users');


app.use('/events', eventsRoutes);
app.use('/participants', participantsRoutes);
app.use('/users', usersRoutes);


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if(req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }

    next();
});




app.use((req, res, next) =>{
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) =>{
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

const port = process.env.PORT || 5050;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
