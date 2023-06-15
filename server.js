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
    console.info(`${req.method} request received to RELAY`);
    let newParsedData;

    if (req.body.nickname) {
        //reads the current data contained within chat_db.json
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);

                if (parsedData.length) {
                    //if user already exists push new message.
                    newParsedData = parsedData.map((data) => {
                        if (data.nickname === req.body.nickname) {
                            data.messages.sent.push(req.body.message)
                        } else {
                            data.messages.received.push(req.body.message)
                        }
                        return data
                    })

                    fs.writeFile('./db/chat_db.json', JSON.stringify(newParsedData, null, '\t'), (writeErr) => {
                        writeErr
                            ? console.error(writeErr)
                            : console.log(
                                `userData has been written to chat_db.json`
                            );
                    });
                    const response = {
                        status: 'success',
                        body: newParsedData,
                        ogMessage: req.body,
                    }
                    res.status(200).json(response);
                }
            };
        });
    } else {
        alert(res.status(500).json("It's messed up, man"))
    }
});


app.post('/changedUserRelay', (req, res) => {
    console.info(`${req.method} request received to /CHANGEDUSERRELAY`);
    console.log(req.body);
    let newUser;
    if (req.body.nickname) {
        //reads the current data contained within chat_db.json
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);

                if (parsedData.length) {
                    //if user already exists push new message.
                    const newParsedData = parsedData.map((data) => {
                        if (data.nickname === req.body.nickname && data.loggedIn) {
                            data.messages.received.push('USER IS ALREADY LOGGED IN')
                        } else if (data.nickname === req.body.nickname && !data.loggedIn) {
                            data.messages.sent.push(req.body.message)
                            data.loggedIn = true;
                        } else {
                            data.messages.received.push(req.body.message)
                        }

                        if (data.nickname === req.body.loggedInUser) {
                            data.loggedIn = false;
                        };
                        return data
                    })

                    const userCheck = newParsedData.map((data) => {
                        if (data.nickname !== req.body.nickname) {
                            return false;
                        } else {
                            return true;
                        };
                    });

                    if (userCheck.includes(true)) {
                        console.log('usercheck returns true')
                    } else {
                        newUser = {
                            id: req.session.id,
                            nickname: req.body.nickname,
                            loggedIn: true,
                            messages: {
                                sent: [req.body.message],
                                received: []
                            }
                        }
                        newParsedData.push(newUser)
                        //console.log('CHANGEDUSERRELAY - NEWUSER')
                        //console.log(newUser)
                    }

                    //console.log('CHANGEDUSERRELAY - NEWPARSEDATA')
                    //console.log(newParsedData)

                    fs.writeFile('./db/chat_db.json', JSON.stringify(newParsedData, null, '\t'), (writeErr) => {
                        writeErr
                            ? console.error(writeErr)
                            : console.log(
                                `userData has been written to chat_db.json`
                            );
                    });

                    const response = {
                        status: 'success',
                        body: newParsedData
                    }

                    res.status(200).json(response)
                } else {
                    res.status(500).json("It's messed up, man.")
                }
            };
        });
    };
});

app.post('/status', (req, res) => {
    console.info(`${req.method} request received to update STATUS`);
    console.log(req.body.nickname)

    if (req.body.nickname) {
        //reads the current data contained within chat_db.json
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);
                if (parsedData.length) {
                    //if user already exists push new message.
                    const newParsedData = parsedData.map((data) => {
                        console.log('STATUSMAPDATA:')
                        console.log(data)
                        if (data.nickname === req.body.nickname) {
                            data.loggedIn = false;
                        }
                        return data
                    })
                    console.log('NEWPARSEDDATA')
                    console.log(newParsedData)
                    //adds new messages to the appropriate user if exists. else, new user.
                    fs.writeFile('./db/chat_db.json', JSON.stringify(newParsedData, null, '\t'), (writeErr) => {
                        writeErr
                            ? console.error(writeErr)
                            : console.log(
                                `newParsedData has been written to chat_db.json`
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
})


// receives the previous users nickname and the new userData object in an array
//if there is a new nickname it reads chat_db, parses it,
//switches the previous user's logged-in status to false and saves the db data in a new array
// then pushes the new userData model to the db array
app.post('/postUserData', (req, res) => {
    console.info(`${req.method} received to update user data.`);
    const oldUser = req.body[0].nickname
    const userData = req.body[1]
    console.log(oldUser)
    console.log(userData)
    console.log('POSTUSERDATA');
    console.log(req.body);
    if (userData.nickname) {
        //reads the current data contained within chat_db.json
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);
                //if there is no data, just write the new data to it
                if (!parsedData.length) {

                    //if user already exists push new message.
                    const newParsedData = parsedData.map((data) => {
                        console.log('STATUSMAPDATA:')
                        console.log(data)
                        if (data.nickname === oldUser) {
                            data.loggedIn = false;
                        }
                        return data
                    })
                    console.log('NEWPARSEDDATA')
                    console.log(newParsedData)
                    newParsedData.push(userData)
                    //parsedData.push(userData);

                    fs.writeFile('./db/chat_db.json', JSON.stringify(newParsedData, null, '\t'), (writeErr) => {
                        writeErr
                            ? console.error(writeErr)
                            : console.log(
                                `if userData has been written to chat_db.json`
                            );
                    });


                } else {
                    //if data exists, check to see if the current nickname already exists
                    let nicknameExists = [];

                    parsedData.map((data) => {
                        userData.nickname === data.nickname && data.loggedIn === true ? nicknameExists.push(true) : nicknameExists.push(false)
                    });
                    //if so, do nothing.  if not, write to chat_db.json
                    if (nicknameExists.includes(true)) {
                        console.log(`nickname is already logged in. Try again`)
                    } else {
                        //parsedData.push(req.body);

                        //fs.writeFile('./db/chat_db.json', JSON.stringify(parsedData, null, '\t'), (writeErr) => {
                        //    writeErr
                        //        ? console.error(writeErr)
                        //        : console.log(
                        //        `else userData has been written to chat_db.json`
                        //        );
                        //}); 
                        //if user already exists push new message.
                        const newParsedData = parsedData.map((data) => {
                            console.log('STATUSMAPDATA:')
                            console.log(data)
                            if (data.nickname === oldUser) {
                                data.loggedIn = false;
                            }
                            return data
                        })
                        console.log('NEWPARSEDDATA')
                        console.log(newParsedData)
                        newParsedData.push(userData)
                        //parsedData.push(userData);

                        fs.writeFile('./db/chat_db.json', JSON.stringify(newParsedData, null, '\t'), (writeErr) => {
                            writeErr
                                ? console.error(writeErr)
                                : console.log(
                                    `if userData has been written to chat_db.json`
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

app.get('/subscribe', (req, res) => {
    console.info(`${req.method} request received to SUBSCRIBE`);
    //reads the current data contained within chat_db.json
    fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            const parsedData = JSON.parse(data);
            console.log('SUBSCRIBTION')
            console.log(parsedData)
            if (parsedData.length) {
                //if user already exists push new message.
                const newParsedData = parsedData.map((data) => {
                    console.log('SUBSCRIPTIONMAPDATA:')
                    console.log(data)
                    if (data.loggedIn) {
                        console.log(data.messages.received)
                        const userMessages = {
                            nickname: data.nickname,
                            message: data.messages.received
                        }
                        return userMessages
                    }
                })
                const filteredData = newParsedData.filter(data => data)
                console.log('FILTEREDDATA')
                console.log(filteredData)
                res.json(filteredData)

            }
        };
    });
})

//app.post('/postMessageData', (req, res) => {
//    console.info(`${req.method} received to update message data`);

//    console.log(req.body);
//})


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}!`);
});