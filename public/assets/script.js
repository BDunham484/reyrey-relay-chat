const formSubmitOne = document.getElementById('form-submit-one');
const inputOne = document.getElementById('input-one');
const inputTwo = document.getElementById('input-two');
const nicknameOne = document.getElementById('nickname-one');
const nicknameTwo = document.getElementById('nickname-two');
let timer;

// route that gets specific username stored with each browser session and passes it to postUserData()
const getSessName = async () => {
    try {
        const res = await fetch('/getSessName', {
            method: 'GET',
        })
        const data = await res.json()
        let localData = localStorage.getItem('nicknames') || ''
        const oldUser = {
            nickname: localData
        }
        console.log('OLDUSER: ')
        console.log(oldUser)

        loggedInUser = data.nickname
        nicknameOne.value = data.nickname

        const userData = [
            {
                nickname: localData
            },
            {
                id: data.id,
                nickname: data.nickname,
                loggedIn: true,
                messages: {
                    sent: [],
                    received: [],
                },
                blocked: [],
            }
        ]

        localStorage.setItem('nicknames', loggedInUser)
        postUserData(userData)

        return data
    } catch (err) {
        console.log(err)
    }
}

getSessName();

//get request that polls the db for the last received messages of the current user and diplays in incoming messages.
const subscribe = async () => {

    const currentUser = localStorage.getItem('nicknames')
    //console.log('CURRENTUSER')
    //console.log(currentUser)
    try {
        const res = await fetch('/subscribe', {
            method: 'GET'
        })
        const data = await res.json();

        let newData = data.map((userData) => {
            //console.log('USERDATA')
            //console.log(userData.nickname)
            if (currentUser === userData.nickname && userData.received.length > 0) {
                //if (userData.received.length && currentUser === userData.nickname) {
                //console.log('SUBNSCRIBEMAPDATA')
                //console.log(userData.received)
                inputTwo.value = ` ${userData.received[userData.received.length - 1].sender}: ${userData.received[userData.received.length - 1].message}`
                return userData.received[userData.received.length - 1]
            } else {
                return '';
            }
        })

        newData = newData.filter(data => data)

        timer = setTimeout(subscribe, 3000)
    } catch (err) {
        console.log(err)
        subscribe()
    }
};

subscribe();




// POST route that gets userInput and sends to input two
const postText = async (userInput) => {

    if (!userInput.nickname) {
        alert("You must enter a nickname!")
    } else {
        try {
            const res = await fetch('/relay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInput)
            })
            const data = await res.json()

            const {
                body: userData,
                ogMessage: { nickname },
                ogMessage: { message }
            } = data


            //userData.map((data) => {
            //    //console.log(data.messages.received[data.messages.received.length-1])
            //    if (data.loggedIn) {
            //        inputTwo.value = data.messages.received[data.messages.received.length - 1]
            //    }
            //})

            const newMessage = {
                nickname,
                message,
                userData
            }

            return newMessage
        } catch (err) {
            console.log(err)
            subscribe()
        }
    }
}

//POST route that gets user input and sends to a specific user
const postTextTo = async (userInput) => {
    if (!userInput.nickname) {
        alert("You must enter a nickname!")
    } else {
        try {
            const res = await fetch('/relayTo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInput)
            })
            const data = await res.json()
            console.log('POSTTEXTTO-RETURNEDDATA')
            console.log(data)
            return data
        } catch (err) {
            console.error(err)
            subscribe()
        };
    };
};

//if nickname is changed and new nickname doesn't already exist function creates new user and sends message to all. If nickname already exists it uses existing user.'
const postChangedUserText = async (userInput) => {
    let newNickname = userInput.nickname

    if (!userInput.nickname) {
        alert("You must enter a nickname!")
    } else {
        try {
            const res = await fetch('/changedUserRelay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInput)
            })
            const data = await res.json()

            const { body } = data
            //console.log('THISISHTEBODYDATAYOUWANTOTLOOKAT')
            //console.log(body);
            const confirm = body.map((data, index) => {
                if (data.nickname === newNickname) {
                    return index;
                } else {
                    return false;
                };
            });
            //console.log(confirm)
            let index = confirm.filter(data => data)
            if (!index.length) {
                index = 0;
            }
            //console.log(index)
            newNickname = body[index].nickname
            //console.log(newNickname)
            let messageIndex = (body[index].messages.sent.length) - 1
            let message = body[index].messages.sent[messageIndex];
            let receivedIndex = (body[index].messages.received.length) - 1
            let received = body[index].messages.received[receivedIndex];
            let oldNickname = localStorage.getItem('nicknames') || ''
            //console.log('received: ' + received)
            let newMessage

            if (received === 'USER IS ALREADY LOGGED IN') {
                alert('USER IS ALREADY LOGGED IN! TRY ANOTHER USER.')
                nicknameOne.value = oldNickname;
                newMessage = {
                    newNickname: oldNickname,
                    message: ''
                }
            } else {
                newMessage = {
                    newNickname: newNickname,
                    message: message
                }
            }
            return newMessage;
        } catch (err) {
            console.log(err)
            subscribe()
        }
    }
}

//if nickname is changed and new nickname doesn't already exist function creates new user and sends message to specific resipient.  If nickname already exists it uses existing user.'
const postChangedUserTextTo = async (userInput) => {
    let newNickname = userInput.nickname

    if (!newNickname) {
        alert("You must enter a nickname!")
    } else {
        try {
            const res = await fetch('/changedUserRelayTo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInput)
            })
            const data = await res.json()

            const { body } = data

            const confirm = body.map((data, index) => {
                if (data.nickname === newNickname) {
                    return index;
                } else {
                    return false;
                };
            });

            let index = confirm.filter(data => data)
            if (!index.length) {
                index = 0;
            }

            newNickname = body[index].nickname

            let messageIndex = (body[index].messages.sent.length) - 1
            let message = body[index].messages.sent[messageIndex];
            let receivedIndex = (body[index].messages.received.length) - 1
            let received = body[index].messages.received[receivedIndex];
            let oldNickname = localStorage.getItem('nicknames') || ''

            let newMessage

            if (received === 'USER IS ALREADY LOGGED IN') {
                alert('USER IS ALREADY LOGGED IN! TRY ANOTHER USER.')
                nicknameOne.value = oldNickname;
                newMessage = {
                    newNickname: oldNickname,
                    message: ''
                }
            } else {
                newMessage = {
                    newNickname: newNickname,
                    message: message
                }
            }
            return newMessage;
        } catch (err) {
            console.error(err)
            subscribe()
        };
    };
};

const blockUser = async (userInput) => {
    if (!userInput.nickname) {
        alert('You must enter a nickname!')
    } else {
        try {
            const res = await fetch('/blockUser', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInput)
            })
            const data = await res.json()
            console.log('BLOCKDATA')
            console.log(data)
            return data
        } catch (err) {
            console.error(err)
            subscribe()
        }
    }
}

const blockUserChangedNickname = async (userInput) => {
    console.log('BLOCKUSERCHANGEDNICKNAME - USERINPUT')
    console.log(userInput)
    let newNickname = userInput.nickname

    if (!newNickname) {
        alert("You must enter a nickname!")
    } else {
        try {
            const res = await fetch('/changedUserBlockUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInput)
            })
            const data = await res.json()

            const { body } = data

            const confirm = body.map((data, index) => {
                if (data.nickname === newNickname) {
                    return index;
                } else {
                    return false;
                };
            });

            let index = confirm.filter(data => data)
            if (!index.length) {
                index = 0;
            }

            newNickname = body[index].nickname

            let messageIndex = (body[index].messages.sent.length) - 1
            let message = body[index].messages.sent[messageIndex];
            let receivedIndex = (body[index].messages.received.length) - 1
            let received = body[index].messages.received[receivedIndex];
            let oldNickname = localStorage.getItem('nicknames') || ''

            let newMessage

            if (received === 'USER IS ALREADY LOGGED IN') {
                alert('USER IS ALREADY LOGGED IN! TRY ANOTHER USER.')
                nicknameOne.value = oldNickname;
                newMessage = {
                    newNickname: oldNickname,
                    message: ''
                }
            } else {
                newMessage = {
                    newNickname: newNickname,
                    message: message
                }
            }
            return newMessage;

        } catch (err) {
            console.error(err)
            subscribe()
        };
    };
};

const unblockUser = async (userInput) => {
    if (!userInput.nickname) {
        alert('You must enter a nickname!')
    } else {
        try {
            const res = await fetch('/unblockUser', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInput)
            })
            const data = await res.json()
            console.log('UNBLOCKDATA')
            console.log(data)
            return data
        } catch (err) {
            console.error(err)
            subscribe()
        }
    }
}

//takes the new sessName and posts it to chat_db.json
const postUserData = async (userData) => {

    if (!userData) {
        console.log('No userData');
    } else {
        try {
            const res = await fetch('/postUserData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            })
            const data = await res.json()
            console.log('POSTUSERDATA-DATA');
            console.log(data)
            return data
        } catch (err) {
            console.log(err)
            subscribe()
        };
    };
};

//gets and returns a list of all loggedIn users
const getUsers = async (userInput) => {
    try {
        const res = await fetch('/getUsers', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userInput)
        })
        const data = await res.json()
        console.log('RETURNEDUSERDATA')
        console.log(data);
        //let stringData = data.join('\n');
        //console.log(stringData)
        //inputTwo.value = 'LOGGED-IN: \n' + stringData;
        inputTwo.value = data
    } catch (err) {
        console.error(err)
        subscribe()
    }
}

const invalidCommand = async (userData) => {
    try {
        const res = await fetch('/invalidCommand', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        const data = await res.json()
        console.log('RETURNED INVALID COMMAND DATA')
        console.log(data)
    } catch (err) {
        console.log(err)
        //subscribe()
    }
}


const submitOneHandler = (e) => {
    e.preventDefault();
    if (!nicknameOne.value || !inputOne.value) {
        alert('You must fill out both inputs!')
    } else {
        const messageArr = inputOne.value.split(' ')

        // if message has /msg or /query prefix 
        if (messageArr[0] === '/msg' || messageArr[0] === '/query') {
            const to = messageArr[1]
            messageArr.splice(0, 2)
            const message = messageArr.join(' ')
            let userInputTo = {
                'to': to,
                'nickname': nicknameOne.value,
                'message': message,
                'loggedInUser': localStorage.getItem('nicknames')
            }
            if (userInputTo.nickname === userInputTo.loggedInUser) {
                postTextTo(userInputTo)
                    .then((data) => {
                        subscribe()
                    })
                    .catch((err) => console.error(err))
            } else {
                postChangedUserTextTo(userInputTo)
                    .then((data) => {
                        subscribe()
                    })
                    .catch((err) => console.error(err))
            }
        }
        //else if message has /ignore prefix
        else if (messageArr[0] === '/ignore') {
            const userToBlock = messageArr[1]
            let userInput = {
                'nickname': nicknameOne.value,
                'userToBlock': userToBlock,
                'loggedInUser': localStorage.getItem('nicknames')
            }
            if (userInput.nickname === userInput.loggedInUser) {
                blockUser(userInput)
                    .then((data) => {
                        subscribe()
                    })
                    .catch((err) => console.error(err))
            } else {
                blockUserChangedNickname(userInput)
            }
        }
        //else if message has /unignore prefix
        else if (messageArr[0] === '/unignore') {
            const userToUnblock = messageArr[1]
            let userInput = {
                'nickname': nicknameOne.value,
                'userToUnblock': userToUnblock,
                'loggedInUser': localStorage.getItem('nicknames')
            }
            if (userInput.nickname === userInput.loggedInUser) {
                unblockUser(userInput)
                    .then((data) => {
                        subscribe()
                    })
                    .catch((err) => {
                        console.error(err)
                    })
            }
        }
        //else if message has /users prefix
        else if (messageArr[0] === '/users') {
            let userInput = {
                'nickname': nicknameOne.value,
                'loggedInUser': localStorage.getItem('nicknames')
            }
            if (userInput.nickname === userInput.loggedInUser) {
                getUsers(userInput)
                    .then((data) => {
                        subscribe()
                    })
            }
        }
        else if (messageArr[0][0] === '/') {
            let userData = {
                'nickname': nicknameOne.value,
                'invalid': inputOne.value
            }
            console.log('INVALID COMMAND CAUGHT')
            if (userData) {
                invalidCommand(userData)
                    .then((data) => {
                        subscribe()
                    })
            }
        }
        //else message does not have prefixes
        else {
            let userInput = {
                'nickname': nicknameOne.value,
                'message': inputOne.value,
                'loggedInUser': localStorage.getItem('nicknames')
            }
            console.log('LOGGEDINUSER: ' + userInput.loggedInUser)
            if (userInput.nickname === userInput.loggedInUser) {
                postText(userInput)
                    .then((newMessage) => {
                        //const inputTwoValue = `${newMessage.nickname} : ${newMessage.message}`
                        //inputTwo.value = inputTwoValue
                        subscribe()
                    })
                    .catch((err) => console.error(err))
            } else {
                postChangedUserText(userInput)
                    .then((newMessage) => {
                        console.log('RETURNEDMESSAGEFORCHANGEDUSER')
                        console.log(newMessage)
                        localStorage.setItem('nicknames', newMessage.newNickname)
                        /*!newMessage.message ? inputTwo.value = '' : inputTwo.value = `${newMessage.newNickname}: ${newMessage.message}`*/
                        subscribe()
                    })
                    .catch((err) => console.error(err))
            }
        }


        clearTimeout(timer)


        inputOne.value = '';
    }
}

formSubmitOne.addEventListener('click', submitOneHandler)