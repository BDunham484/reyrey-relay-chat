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
        console.log('LOOKEYHERE')
        console.log(data)
        nicknameOne.value = data.nickname
        const userData = {
            id: data.id,
            nickname: data.nickname,
            loggedIn: true,
            messages: {
                sent: [],
                received: [],
            }
        }
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
            //        return data
        } catch (err) {
            console.log(err);
        };
    };
};

const postMessageData = async (userInput) => {
    try {
        const res = await fetch('/postMessageData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userInput)
        })
        const data = await res.json()
        console.log('POSTMESSAGEDATA')
        console.log(data)
    } catch (err) {
        console.error(err)
    }
}

const submitOneHandler = (e) => {
    e.preventDefault();

    let userInput = {
        'nickname': nicknameOne.value,
        'message': inputOne.value
    }

    //postMessageData(userInput)

    postText(userInput)
        .then((newMessage) => {
            inputTwo.value = `${newMessage.nickname} : ${newMessage.message}`
            //nicknameTwo.value = `${newMessage.nickname} : ${newMessage.message}`
        })
        .catch((err) => console.error(err))

    inputOne.value = '';
}

formSubmitOne.addEventListener('click', submitOneHandler)