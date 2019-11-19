// see http://socket.io
const express = require('express');
const path = require('path');
const http = require('http')
const socketio = require('socket.io')

const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');
const { generateMessage, generateLocationMessage } = require('./utils/messages');

const app = express();
const server = http.createServer(app) //express does this behind the scenes, we bring it forward for socket.io
const io = socketio(server);

const port = 3000;

const publicDirPath = path.join(__dirname, '../public')

let serverCount = 0
const welcomeMessage = 'ADMIN: You are now connected to the server'
app.use(express.static(publicDirPath))

// ON - respond to client messages
// EMIT - sent messages to the client
//  socket.emit = send to one socket
//  io.emit = send to all sockets
//  socket.broadcast.emit - send message to all but current socket
//  io.to.emit = send message to a specific room
//  io.broadcast.to.emit = send message to a specific room except for current socket

io.on('connection', (clientSocket) => { //
  console.log('socket.io: in chat app, new websocket connection')
  //clientSocket.emit('countUpdated', serverCount)  //my custom server event, sent to only the new connected client
  //clientSocket.emit('serverMessage', welcomeMessage)
  //clientSocket.broadcast.emit('serverMessage','a new user has joined') // sent to everyone but the current clientSocket

  // receiving client event
  clientSocket.on('clientIncrement', () => {
    console.log('received clientIncrement event')
    serverCount++;
    //clientSocket.emit('countUpdated', serverCount) // emit to only one connection
    io.emit('countUpdated', serverCount) // emit to all connections
  })

  clientSocket.on('join', (user, sendAck) => {
    console.log('JOIN user: '+user.userName+', room: '+user.room)

    const { error, newuser } = addUser({ 'id': clientSocket.id, 'iname': user.userName, 'iroom': user.room})

    if (error) {
      const er = "ADMIN: "+error
      console.log("IN join, error: "+error)
      return sendAck(er)
    }

    const myroom = newuser.room;
    clientSocket.join(myroom)  // emit to specific room

    if (error) {
      const er = "ADMIN: "+error
      clientSocket.emit('serverMessage', er)
    } else {}

    clientSocket.emit('serverMessage', welcomeMessage)
    clientSocket.broadcast.to(myroom).emit('serverMessage',`<br />ADMIN: new user ${user.userName} has joined room: ${myroom}`) // sent to everyone but the current clientSocket

    // add to all user room lists
    const users = getUsersInRoom(myroom)
    const connData = { 'users': users, 'room': myroom}
    io.to(myroom).emit('updateRoomMembers', connData)
  })

  clientSocket.on('sendClientMessage', (msg, sendAck) => {
    console.log('received sendClientMessage event, msg: '+msg)

    // see bad-words npm module to censor messages
    //const filter = new Filter()
    //if (filter.isProfane(msg)) {
    //  return sendAck("Profanity is not permitted")
    //}

    const user = getUser(clientSocket.id)

    // send to everyone in room
    if (user) {
      io.to(user.room).emit('chatMessageUpdated', generateMessage(user.username, msg)) // emit to all connections
      sendAck("SERVER OK")
    } else {
      console.log(`ERROR, could not find the user for the socket id ${clientSocket.id} in sendClientMessage`)
      sendAck('ADMIN: THERE WAS AN ERROR SENDING THE MESSAGE')
    }
  })

  clientSocket.on('sendClientLocation', (loc) => {
    console.log('received sendClientLocation, lat: '+loc.lat+", long: "+loc.long)
    const user = getUser(clientSocket.id)
    if (user) {
      io.to(user.room).emit('serverLocation', generateLocationMessage(user.username, `https://google.com/maps?q=${loc.lat},${loc.long}`)) // emit to all connections
    } else {
      console.log(`ERROR, could not find the user for the socket id ${clientSocket.id} in sendClientLocation`)
      sendAck('ADMIN: THERE WAS AN ERROR SENDING THE LOCATION')
    }
  })

  // remove member from room and send out updated list
  clientSocket.on('disconnect', () => {
    console.log("IN disconnect")
    const olduser = removeUser(clientSocket.id)
    if (olduser) {
      io.to(olduser.room).emit('serverMessage', `<br />ADMIN: user ${olduser.username} has left room ${olduser.room}`)
      console.log(`user ${olduser.username} has left room ${olduser.room}`)


      // update all user room lists
      const users = getUsersInRoom(olduser.room)
      const connData = { 'users': users, 'room':olduser.room}
      io.to(olduser.room).emit('updateRoomMembers', connData)
    }

  })

  // when members enter or leave a room
  //clientSocket.on('updatedRoomMembers', () => {
  //  const users = getUsersInRoom(olduser.room)
  //  console.log("USERS IN ROOM: "+olduser.room+", users: "+users)
  //  io.to(olduser.room).emit('showUpdatedRoomMembers', user)
  //})

})



server.listen(port, () => {
  console.log(`chat application is running on port ${port}`);
});
