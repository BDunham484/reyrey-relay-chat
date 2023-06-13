const express = require("express");
const path = require("path");
const app = express();
const { random_userName } = require('./utils/helpers');
const fs = require('fs');

const session = require('express-session');
const MemoryStore = require('memorystore')(session)


const PORT = 3000;

//set up session
const sess = {
    secret: 'for your eyes only',
    name: random_userName(),
    cookie: {},
    resave: false,
    saveUninitialized: true,
    store: new MemoryStore({
        checkPeriod: 86400000
    })
}

app.use(session(sess));

app.get('/', (req, res, next) => {
    req.session.user = sess.name
    req.session.profile = {
        'id': req.session.id,
        'nickname': req.session.user
    }
    req.session.save()
    next();
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'))
})

app.get('/getSessName', (req, res) => {
    res.json(req.session.profile)
})

app.post('/relay', (req, res) => {
    console.info(`${req.method} request received`);

    if (req.body.nickname) {
        //reads the current data contained within chat_db.json
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);
                if (parsedData.length) {
                    //if user already exists push new message.
                    parsedData.map((data) => {
                        if (data.nickname === req.body.nickname) {
                            data.messages.sent.push(req.body.message)
                            data.loggedIn = true;
                        }
                    })
                    //adds new messages to the appropriate user if exists. else, new user.
                    fs.writeFile('./db/chat_db.json', JSON.stringify(parsedData, null, '\t'), (writeErr) => {
                        writeErr
                            ? console.error(writeErr)
                            : console.log(
                                `userData has been written to chat_db.json`
                            );
                    });
                }
            };
        });
    };

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
});


// receives the current nickname and posts it to chat_db.json
app.post('/postUserData', (req, res) => {
    console.info(`${req.method} received to update user data.`);
    console.log('POSTUSERDATA');
    console.log(req.body.nickname);
    if (req.body.nickname) {
        //reads the current data contained within chat_db.json
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);
                //if there is no data, just write the new data to it
                if (!parsedData.length) {
                    parsedData.push(req.body);

                    fs.writeFile('./db/chat_db.json', JSON.stringify(parsedData, null, '\t'), (writeErr) => {
                        writeErr
                            ? console.error(writeErr)
                            : console.log(
                                `userData has been written to chat_db.json`
                            );
                    });
                } else {
                    parsedData[parsedData.length - 1].loggedIn = false;

                    //if data exists, check to see if the current nickname already exists
                    let nicknameExists = [];

                    parsedData.map((data) => {
                        req.body.nickname === data.nickname && data.loggedIn === true ? nicknameExists.push(true) : nicknameExists.push(false)

                        console.log(req.session.profile)

                        //if (data.previousUser === true) {
                        //    data.previousUser = false
                        //        data.loggedIn = false
                        //}
                    });
                    //if so, do nothing.  if not, write to chat_db.json
                    if (nicknameExists.includes(true)) {
                        console.log(`nickname already exists. Try again`)
                    } else {
                        parsedData.push(req.body);

                        fs.writeFile('./db/chat_db.json', JSON.stringify(parsedData, null, '\t'), (writeErr) => {
                            writeErr
                                ? console.error(writeErr)
                                : console.log(
                                    `userData has been written to chat_db.json`
                                );
                        });
                    };
                };
            };
        });
        //return status 201 on success
        const response = {
            status: 'success',
            body: req.body,
        }
        res.status(201).json(response);
    } else {
        res.status(500).json('Error in posting data')
    }
});

app.post('/postMessageData', (req, res) => {
    console.info(`${req.method} received to update message data`);

    console.log(req.body);
})






app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}!`);
});