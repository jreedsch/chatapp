// add, get, get user in a room, and remove users

const users = [];

// id is from socket
const addUser = ({ id, iname, iroom }) => {  //destructured obj
  // convert inputs to lowercase
  const username = iname.trim().toLowerCase();
  const room = iroom.trim().toLowerCase();

  if (!username || !room) {
    return {
      error: 'username and room are required'
    }
  }

  // check for existing users
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username
  })

  if (existingUser) {
    return {
      error: `user: ${username} is already in room ${room}`
    }
  }

  // store user
  const user = { id, username, room };
  users.push(user)
  console.log("after addUser, users:" +JSON.stringify(users))
  return { 'newuser': user }


} //addUser

const removeUser = (id) => {

  // check for existing users
  //const index = users.findIndex((user) => {
  //  return user.id === id
  //})   \/\/ identical
  const index = users.findIndex((user) => user.id === id)

  let olduser = undefined;
  if (index !== -1) {
    olduser = users.splice(index, 1)[0]
    //return users.splice(index, 1)[0]
  }

  console.log("after removeUser, users:" +JSON.stringify(users))
  return olduser;

} //removeUser


const getUser = (id) => {
    return users.find((user) => user.id === id ) //shorthand syntax
}

const getUsersInRoom = (room) => {
  room = room.trim().toLowerCase();
  return users.filter((user) => {
    return user.room === room  //keep array element if true
  })
}

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
}
/*
addUser({'id':1, 'iname':'Me','iroom':'Colorado'})
addUser({'id':2, 'iname':'You','iroom':'Colorado'})
addUser({'id':3, 'iname':'You','iroom':'Cali'})
console.log("users:" +JSON.stringify(users))
console.log(removeUser(1));
console.log("C users:" +JSON.stringify(users))
const uu = getUser(2)
console.log(uu)
console.log(getUsersInRoom('Colorado'))
*/
