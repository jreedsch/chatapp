const serverSocket = io(); //connection to serverSocket

const $messageForm = document.querySelector('#chatMsgForm'); //$ = convention for variables of HTML elements
const $messageFormButton = document.querySelector('#msgFormButton'); // donlt use findById here
const $messageInputField = document.querySelector('#msgInputField');
const $messageDisplay = document.querySelector('#chatmsgfromserver')
const $serverMessage = document.querySelector('#msg');
// message template
const messageTemplate  = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML

const userName = getQueryVariable('username')
const room = getQueryVariable('room')
console.log('username: '+userName+", room: "+room)

serverSocket.emit('join', {userName, room}, (error) => {
  if (error) {
    //$serverMessage.insertAdjacentHTML('beforeend',error);
    alert(error);
    location.href = '/'
  }
})

serverSocket.on('countUpdated', (serverCount) => { //listen for my customer server event
  console.log('count updated by server: '+serverCount)
  document.querySelector('#serverCount').innerHTML = serverCount
})

serverSocket.on('serverMessage', (msg) => { //listen for my customer server event
  //document.querySelector('#msg').innerHTML = msg
  $serverMessage.insertAdjacentHTML('beforeend',msg);
})

// show updated list of users in room
serverSocket.on('updateRoomMembers', (connData) => {
  console.log("IN updateRoomMembers, users: "+JSON.stringify(connData.users))
  document.querySelector('#userList').innerHTML  = ''
  connData.users.forEach((user) => {
    const uu = `<br /> ${user.username}`
    document.querySelector('#userList').innerHTML += uu
  })
  document.querySelector('#roomname').innerHTML  = connData.room

})

serverSocket.on('serverLocation', (loc) => { //listen for my customer server event
  //document.querySelector('#loclink').innerHTML = link
  console.log("loc: "+JSON.stringify(loc))
  const linkobj = Mustache.render(locationTemplate, {'createdAt': loc.createdAt, 'url': loc.url, 'username':loc.username });
  document.querySelector('#loclink').insertAdjacentHTML('beforeend',linkobj);
})

serverSocket.on('chatMessageUpdated', (msgobj) => { //listen for my customer server event
  //const newLine = " "+msg+"<br />"
  //document.querySelector('#chatmsgfromserver').innerHTML += newLine
  const html = Mustache.render(messageTemplate, {'username': msgobj.username, 'createdAt': msgobj.createdAt, 'msgValue': msgobj.text});
  $messageDisplay.insertAdjacentHTML('beforeend',html);

})


document.getElementById('incrementServerCount').addEventListener('click', () => {
  console.log('incrementServerCount click')
  serverSocket.emit('clientIncrement')
})

//document.getElementById('chatMsgForm').addEventListener('submit', (evt) => {
$messageForm.addEventListener('submit', (evt) => {

  evt.preventDefault()
  // disable form
  $messageFormButton.setAttribute('disabled', 'disabled')

  const chatMsg = evt.target.elements.myMessage.value;  //document.querySelector('input').value
  console.log('IN sendForm, message: '+chatMsg)
  serverSocket.emit('sendClientMessage', chatMsg, (ackMsg) => {
    console.log("ack from server: "+ackMsg) // ack from server

    // re-enable form
    $messageFormButton.removeAttribute('disabled', 'disabled')
    $messageInputField.value = ''
    $messageInputField.focus()
  })

});

document.querySelector('#sendLocation').addEventListener('click', () => {
  if(!navigator.geolocation) {
    return alert("geolocation is not supported by your browser")
  }

  const loc = navigator.geolocation.getCurrentPosition((position) => { // asynchronous but functin doesn't support async or promises
    console.log("position.coords, lat:"+position.coords.latitude+", long: "+position.coords.longitude)
    const loc = {'lat':position.coords.latitude, 'long':position.coords.longitude}
    serverSocket.emit('sendClientLocation', loc)
  })
})

// vid#167 uses Qs
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}
