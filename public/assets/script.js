const formSubmitOne = document.getElementById('form-submit-one');
const inputOne = document.getElementById('input-one');
const inputTwo = document.getElementById('input-two');
const nicknameOne = document.getElementById('nickname-one');
const nicknameTwo = document.getElementById('nickname-two');


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
                body: { nickname },
                body: { message }
            } = data

            const newMessage = {
                nickname,
                message
            }

            return newMessage
        } catch (err) {
            console.log(err)
        }
    }

}

const postChangedUserText = async (userInput) => {

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

            const {
                body: { nickname },
                body: { message }
            } = data

            const newMessage = {
                nickname,
                message
            }

            return newMessage
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

//const postMessageData = async (userInput) => {
//    try {
//        const res = await fetch('/postMessageData', {
//            method: 'POST',
//            headers: {
//                'Content-Type': 'application/json',
//            },
//            body: JSON.stringify(userInput)
//        })
//        const data = await res.json()
//        console.log('POSTMESSAGEDATA')
//        console.log(data)
//    } catch (err) {
//        console.error(err)
//    }
//}



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
                })
                .catch((err) => console.error(err))
        }

        //postMessageData(userInput)



        inputOne.value = '';
    }
}

formSubmitOne.addEventListener('click', submitOneHandler)