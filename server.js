const express = require("express");
const path = require("path");
const app = express();
const { random_userName } = require('./utils/helpers');

var session = require('express-session');

const PORT = 3000;

//set up session
const sess = {
    secret: 'for your eyes only',
    name: random_userName(),
    cookie: {},
    resave: false,
    saveUninitialized: true,
}

app.use(session(sess));

app.get('/', (req, res, next) => {
    req.session.user = sess.name
    const userName = req.session.user
    console.log(sess.name)
    console.log(userName)
    next();
})


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, '/public/index.html'))
})

app.get('/getSessName', (req, res) => {
    res.json(req.session.user)
})

app.post('/relay', (req, res) => {
    console.info(`${req.method} request received`);

    if (req.body) {
        const response = {
        status: 'success',
        body: req.body
    }

    console.log(response);
    res.status(200).json(response);
    } else {
       alert(res.status(500).json("It's messed up, man"))
    }  
})


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}!`);
});