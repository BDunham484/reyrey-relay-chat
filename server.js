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


//post message to all users
app.post('/relay', (req, res) => {
    console.info(`${req.method} request received to RELAY`);
    //console.log('RELAY INCOMING')
    //console.log(req.body.message)

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
                        const messageObj = {
                            sender: req.body.nickname,
                            message: req.body.message
                        }
                        if (data.nickname === req.body.nickname) {
                            data.messages.sent.push(req.body.message)
                        } else if (!data.blocked.includes(req.body.nickname)) {
                            data.messages.received.push(messageObj)
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
        res.status(500).json("It's messed up, man")
    }
});

//post message to specific user
app.post('/relayTo', (req, res) => {
    console.info(`${req.method} request received to RELAYTO`);
    console.log(req.body);
    let newParsedData;

    if (req.body.to) {
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);
                //checks to see if there is any data in the db
                if (parsedData.length) {
                    //let isSenderBlocked;
                    //check to see if message recipient has blocked sender
                    let isSenderBlocked = parsedData.map((data) => {
                        if (data.nickname === req.body.to && data.blocked.includes(req.body.nickname)) {
                            return true
                        } else {
                            return false
                        }
                    })
                    isSenderBlocked.includes(true) ? isSenderBlocked = true : isSenderBlocked = false

                    console.log('ISSENDERBLOCKED: ' + isSenderBlocked)

                    //if the user exists, post message. else, return error message
                    //returned data is then rewritten to the db
                    newParsedData = parsedData.map((data) => {
                        let messageObj = {
                            sender: req.body.nickname,
                            message: req.body.message
                        }
                        if (data.nickname === req.body.nickname && isSenderBlocked) {
                            messageObj = {
                                sender: 'BLOCKED!',
                                message: `${req.body.to} has blocked you.`
                            }

                            data.messages.received.push(messageObj)
                        }

                        if (data.nickname === req.body.to && !data.blocked.includes(req.body.nickname)) {
                            data.messages.received.push(messageObj)
                        }

                        if (data.nickname === req.body.nickname) {
                            data.messages.sent.push(req.body.message)
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
        res.status(500).json('Danger Danger')
    }
})

//changed sender nickname and post message to all
app.post('/changedUserRelay', (req, res) => {
    console.info(`${req.method} request received to /CHANGEDUSERRELAY`);
    /*console.log(req.body);*/
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
                        const messageObj = {
                            sender: req.body.nickname,
                            message: req.body.message
                        }
                        if (data.nickname === req.body.nickname && data.loggedIn) {
                            data.messages.received.push('USER IS ALREADY LOGGED IN')
                        } else if (data.nickname === req.body.nickname && !data.loggedIn) {
                            data.messages.sent.push(req.body.message)
                            data.loggedIn = true;
                        } else if (!data.blocked.includes(req.body.nickname)) {
                            data.messages.received.push(messageObj)
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
                            },
                            blocked: [],
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

//changed sender nickname and post message to specific user
app.post('/changedUserRelayTo', (req, res) => {
    console.info(`${req.method} request received to /CHANGEDUSERRELAYTO`);
    console.log(req.body)
    let newUser;
    if (req.body.to) {
        //reads the current data contained within chat_db.json
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);

                if (parsedData.length) {
                    //if user already exists push new message.
                    const newParsedData = parsedData.map((data) => {
                        if (data.blocked.includes(req.body.nickname)) {
                            return `${req.body.to} has blocked you.`
                        } else {
                            const messageObj = {
                                sender: req.body.nickname,
                                message: req.body.message
                            }
                            if (data.nickname === req.body.nickname && data.loggedIn) {
                                data.messages.received.push('USER IS ALREADY LOGGED IN')
                            } else if (data.nickname === req.body.nickname && !data.loggedIn) {
                                data.messages.sent.push(req.body.message)
                                data.loggedIn = true;
                            }

                            if (data.nickname === req.body.to && !data.blocked.includes(req.body.nickname)) {
                                data.messages.received.push(messageObj)
                            }

                            if (data.nickname === req.body.loggedInUser) {
                                data.loggedIn = false;
                            };
                            return data
                        }
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
                            },
                            blocked: []
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
    }
})

//block a specific user
app.put('/blockUser', (req, res) => {
    console.info(`${req.method} request received to update BLOCKUSER`)
    console.log(req.body)
    if (req.body.nickname) {
        //reads the current data contained within chat_db.json
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);
                if (parsedData.length) {
                    //if user already exists add user to block
                    const newParsedData = parsedData.map((data) => {
                        //console.log('STATUSMAPDATA:')
                        //console.log(data)
                        if (data.nickname === req.body.nickname) {
                            data.blocked.push(req.body.userToBlock)
                        }
                        return data
                    })
                    //console.log('NEWPARSEDDATA')
                    //console.log(newParsedData)
                    //adds new messages to the appropriate user if exists. else, new user.
                    fs.writeFile('./db/chat_db.json', JSON.stringify(newParsedData, null, '\t'), (writeErr) => {
                        writeErr
                            ? console.error(writeErr)
                            : console.log(
                                `newParsedData has been written to chat_db.json`
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
})

//unblock specific user
app.put('/unblockUser', (req, res) => {
    console.info(`${req.method} request received to update UNBLOCKUSER`)
    console.log(req.body)
    if (req.body.nickname) {
        //reads the current data contained within chat_db.json
        fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                const parsedData = JSON.parse(data);
                if (parsedData.length) {
                    //if user already exists add user to block
                    const newParsedData = parsedData.map((data) => {
                        //console.log('STATUSMAPDATA:')
                        //console.log(data)
                        if (data.nickname === req.body.nickname &&
                            data.blocked.includes(req.body.userToUnblock)) {
                            let index = data.blocked.indexOf(req.body.userToUnblock)
                            data.blocked.splice(index, 1)
                        }

                        //if (data.nickname === req.body.nickname) {
                        //    data.blocked.pop(req.body.userToBlock)
                        //}
                        return data
                    })
                    //console.log('NEWPARSEDDATA')
                    //console.log(newParsedData)
                    //adds new messages to the appropriate user if exists. else, new user.
                    fs.writeFile('./db/chat_db.json', JSON.stringify(newParsedData, null, '\t'), (writeErr) => {
                        writeErr
                            ? console.error(writeErr)
                            : console.log(
                                `newParsedData has been written to chat_db.json`
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
})


//change user status from loggedIn true to false
app.post('/status', (req, res) => {
    console.info(`${req.method} request received to update STATUS`);
    //console.log(req.body.nickname)

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
                        //console.log('STATUSMAPDATA:')
                        //console.log(data)
                        if (data.nickname === req.body.nickname) {
                            data.loggedIn = false;
                        }
                        return data
                    })
                    //console.log('NEWPARSEDDATA')
                    //console.log(newParsedData)
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
    //console.log(oldUser)
    //console.log(userData)
    //console.log('POSTUSERDATA');
    //console.log(req.body);
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
                    /* console.log('NEWPARSEDDATA')*/
                    //console.log(newParsedData)
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
                            //console.log('STATUSMAPDATA:')
                            //console.log(data)
                            if (data.nickname === oldUser) {
                                data.loggedIn = false;
                            }
                            return data
                        })
                        //console.log('NEWPARSEDDATA')
                        //console.log(newParsedData)
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
    //console.info(`${req.method} request received to SUBSCRIBE`);
    //reads the current data contained within chat_db.json
    fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            const parsedData = JSON.parse(data);
            //console.log('SUBSCRIBTION')
            //console.log(parsedData)
            if (parsedData.length) {
                //if user already exists push new message.
                const newParsedData = parsedData.map((data) => {
                    //console.log('SUBSCRIPTIONMAPDATA:')
                    //console.log(data)
                    if (data.loggedIn) {
                        const userMessages = {
                            nickname: data.nickname,
                            sent: data.messages.sent,
                            received: data.messages.received,
                        }
                        return userMessages
                    }
                })
                const filteredData = newParsedData.filter(data => data)
                //console.log('FILTEREDDATA')
                //console.log(filteredData)
                res.json(filteredData)

            }
        };
    });
})


app.put('/getUsers', (req, res) => {
    console.info(`${req.method} request received to GETUSERS`)
    console.log(req.body)
    //reads the current data contained within chat_db.json and returns loggedIn users 
    fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            const parsedData = JSON.parse(data);
            //console.log('SUBSCRIBTION')
            //console.log(parsedData)
            if (parsedData.length) {
                //if user already exists push new message.
                let newParsedData = parsedData.map((data) => {
                    //console.log('SUBSCRIPTIONMAPDATA:')
                    //console.log(data)
                    if (data.loggedIn) {
                        return data.nickname
                    }
                })
                let filteredData = newParsedData.filter(data => data)

                const usersString = 'LOGGED-IN: \n' + filteredData.join('\n')

                let reParsedData = parsedData.map((data) => {
                    if (data.nickname === req.body.nickname) {
                        let messageObj = {
                            sender: req.body.nickname,
                            message: usersString
                        }
                        data.messages.received.push(messageObj)
                    }
                    return data
                })

                fs.writeFile('./db/chat_db.json', JSON.stringify(reParsedData, null, '\t'), (writeErr) => {
                    writeErr
                        ? console.error(writeErr)
                        : console.log(
                            `if userData has been written to chat_db.json`
                        );
                });

                res.json(usersString)
            }
        };
    });
})

app.put('/invalidCommand', (req, res) => {
    console.info(`${req.method} request received to INVALIDCOMMAND`)
    console.log(req.body)
    fs.readFile('./db/chat_db.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            const parsedData = JSON.parse(data);

            if (parsedData.length) {

                let newParsedData = parsedData.map((data) => {
                    if (data.nickname === req.body.nickname) {
                        let messageObj = {
                            sender: req.body.nickname,
                            message: `${req.body.invalid} is an invalid command!`
                        }
                        data.messages.received.push(messageObj)
                    }

                    return data
                })

                fs.writeFile('./db/chat_db.json', JSON.stringify(newParsedData, null, '\t'), (writeErr) => {
                    writeErr
                        ? console.error(writeErr)
                        : console.log(
                            `if userData has been written to chat_db.json`
                        );
                });

                res.json(newParsedData)
            }
        };
    });
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}!`);
});