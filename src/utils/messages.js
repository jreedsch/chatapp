const generateMessage = (username, text) => {
  return {
    text,
    createdAt: new Date().getTime(),
    username
  }
}

generateLocationMessage = (username, url) => {
  return {
    url,
    createdAt: new Date().getTime(),
    username
  }
}

module.exports = {
  generateMessage,
  generateLocationMessage
}
