module.exports = {
    random_userName: () => {
        const id = Math.floor(Math.random() * 1000)
        const userName = 'user' + id;
        return userName;
    }
}