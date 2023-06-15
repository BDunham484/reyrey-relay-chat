const formSubmitOne = document.getElementById('form-submit-one');
const inputOne = document.getElementById('input-one');
const inputTwo = document.getElementById('input-two');
const nicknameOne = document.getElementById('nickname-one');
const nicknameTwo = document.getElementById('nickname-two');


const subscribe = async () => {
    const currentUser = localStorage.getItem('nicknames')
    try {
        const res = await fetch('/subscribe', {
            method: 'GET'
        })
        const data = await res.json();
        //console.log(data);
        //console.log('CURRENTUSER: ' + currentUser)
        const newData = data.map((userData) => {
            if (userData.nickname === currentUser) {
                inputTwo.value = `${userData.nickname}: ${userData.message}`
            }
            //console.log(userData)
        })
        //inputTwo.value = data.body.message
        //setTimeout(subscribe, 5000)
    } catch (err) {
        console.log(err);
    }


}

subscribe();


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

            console.log(userData)
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
        }
    }
}

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
            console.log(err);
        };
    };
};


const submitOneHandler = (e) => {
    e.preventDefault();
    if (!nicknameOne.value || !inputOne.value) {
        alert('You must fill out both inputs!')
    } else {
        let userInput = {
            'nickname': nicknameOne.value,
            'message': inputOne.value,
            'loggedInUser': localStorage.getItem('nicknames')
        }

        console.log('LOGGEDINUSER: ' + userInput.loggedInUser)

        if (userInput.nickname === userInput.loggedInUser) {
            postText(userInput)
                .then((newMessage) => {
                    inputTwo.value = `${newMessage.nickname} : ${newMessage.message}`
                })
                .catch((err) => console.error(err))
        } else {
            postChangedUserText(userInput)
                .then((newMessage) => {
                    console.log('RETURNEDMESSAGEFORCHANGEDUSER')
                    console.log(newMessage)
                    localStorage.setItem('nicknames', newMessage.newNickname)
                    !newMessage.message ? inputTwo.value = '' : inputTwo.value = `${newMessage.newNickname}: ${newMessage.message}`
                })
                .catch((err) => console.error(err))
        }
        inputOne.value = '';
    }
}

formSubmitOne.addEventListener('click', submitOneHandler)