const maxPlayersPerRoom = 2;  // اجمالي اللاعبين والبروبس في كل غرفة

module.exports = {
    init: (app) =>
    {
        const io = require("socket.io")(app);
        let roomNumber = 1;
        let rooms = {};
        let roomName = `Room-${roomNumber}`;
        io.on('connection', function (socket)
        {
            var currentPlayer = {};
            //socket.id = 1;
            console.log(`Player ${socket.id} connected`);
            // socket.id = 1;
            socket.on('join room', () =>
            {

                let room = rooms[roomName];
                console.log('room1  ' + JSON.stringify(room))


                // Check if the current room is full or doesn't exist
                while (!room || room.clients.length >= maxPlayersPerRoom)
                {

                    if (!rooms[roomName])
                    {
                        rooms[roomName] = {
                            clients: [],
                            playerCount: 0,
                            propCount: 0,
                            playerSpawnPoints: []
                        };
                        room = rooms[roomName];
                        console.log('room2 ' + JSON.stringify(room))

                    } else
                    {
                        console.log('room3 ' + JSON.stringify(room))
                        roomNumber++;
                        roomName = `Room-${roomNumber}`;
                        room = rooms[roomName];

                    }
                }
                console.log('rooms[roomName]1 ' + JSON.stringify(rooms[roomName]))
                // توزيع اللاعبين والبروبس
                if (rooms[roomName].playerCount < maxPlayersPerRoom / 2)
                {
                    currentPlayer.type = 'player';
                    rooms[roomName].playerCount++;
                    console.log('rooms[roomName]2 ' + JSON.stringify(rooms[roomName]))
                }
                else if (rooms[roomName].propCount < maxPlayersPerRoom / 2)
                {
                    currentPlayer.type = 'prop';
                    rooms[roomName].propCount++;
                }
                console.log('rooms[roomName]3 ' + JSON.stringify(rooms[roomName]))
                // Add the player to the room
                socket.join(roomName);

                var playerRoomSId = {
                    roomName: roomName,
                    socketId: socket.id,
                    type: currentPlayer.type
                };
                socket.emit('getRoomSId', playerRoomSId);
                console.log(`User ${socket.id} joined room ${roomName} as ${currentPlayer.type}`);
            });

            // Rest of the socket event handlers
            socket.on('player connect', function (currentroom)
            {

                console.log("currentroom1 " + JSON.stringify(currentroom));
                rooms[currentroom.roomName].clients.forEach(client =>
                {
                    console.log("client " + JSON.stringify(client))
                    console.log("current socket.id " + socket.id)

                    if (client.socketId != socket.id)//!==socket.id.toString()
                    {
                        if (client.type === 'player')
                        {
                            console.log("client id " + client.socketId + " socket " + socket.id)
                            const playerConnected = {
                                socketId: client.socketId,
                                characterName: client.characterName,
                                name: client.name,
                                position: client.position,
                                rotation: client.rotation,
                                health: client.health
                            };
                            socket.emit('other player connected', playerConnected);
                            console.log("playerConnected " + JSON.stringify(playerConnected))
                        } else if (client.type === 'prop')
                        {
                            const propConnected = {
                                socketId: client.socketId,
                                propName: client.propName,
                                propIndex: client.propIndex,
                                name: client.name,
                                position: client.position,
                                rotation: client.rotation,
                                health: client.health
                            };
                            console.log("propConnected " + JSON.stringify(propConnected))
                            socket.emit('other prop connected', propConnected);
                        }
                    }
                });
            });

            socket.on('play', (currentroom, data) =>
            {

                console.log('ssdssd' + JSON.stringify(data))
                console.log('currentroom0 ' + JSON.stringify(currentroom))

                if (rooms[currentroom.roomName].clients.length === 0)
                {
                    data.playerSpawnPoints.forEach(function (_playerSpawnPoint)
                    {
                        var playerSpawnPoint = {
                            position: _playerSpawnPoint.position,
                            rotation: _playerSpawnPoint.rotation
                        };
                        rooms[currentroom.roomName].playerSpawnPoints.push(playerSpawnPoint);
                    });
                }

                console.log('room ' + JSON.stringify(rooms[currentroom.roomName]))
                console.log('data.propName ' + data.propName + ' data.propIndex ' + data.propIndex)
                var randomSpawnPoint = rooms[currentroom.roomName].playerSpawnPoints[Math.floor(Math.random() * rooms[currentroom.roomName].playerSpawnPoints.length)];
                currentPlayer = {
                    socketId: currentroom.socketId,
                    type: data.type,
                    characterName: data.characterName,
                    propName: data.type === 'prop' ? data.propName : null, //data.propName,
                    propIndex: data.type === 'prop' ? data.propIndex : null, //data.propName,
                    name: data.name,
                    position: randomSpawnPoint.position,
                    rotation: randomSpawnPoint.rotation,
                    health: data.type === 'prop' ? 100 : 100,
                    zDir: data.type === 'player' ? 0 : null,
                    xDir: 0,
                    isRunning: false,
                    velocity: { x: 0, y: 0, z: 0 },// أضف السرعة هنا
                    damage: data.type === 'player' ? 0 : null,

                };
                rooms[currentroom.roomName].clients.push(currentPlayer);
                console.log('currentroom01 ' + JSON.stringify(currentroom));
                console.log('rooms[currentroom.roomName]0 ' + JSON.stringify(rooms[currentroom.roomName]))
                if (data.type === 'player')
                {
                    socket.emit('player', currentPlayer);
                    io.to(currentroom.roomName).emit('other player connected', currentPlayer);
                    console.log('player currentPlayer  ' + JSON.stringify(currentPlayer));
                }
                else if (data.type === 'prop')
                {
                    socket.emit('prop', currentPlayer);
                    io.to(currentroom.roomName).emit('other prop connected', currentPlayer);
                    console.log('prop currentprop  ' + JSON.stringify(currentPlayer));

                }
            });

            socket.on('player move', (currentroom, data, animationData) =>
            {
                currentPlayer.position = data.position;
                currentPlayer.zDir = animationData.zDir;
                currentPlayer.xDir = animationData.xDir;
                currentPlayer.isRunning = animationData.isRunning;

                var updatedData = {
                    socketId: currentPlayer.socketId,
                    position: currentPlayer.position,
                    zDir: currentPlayer.zDir,
                    xDir: currentPlayer.xDir,
                    isRunning: currentPlayer.isRunning,
                };
                io.to(currentroom.roomName).emit('player move', updatedData);
                // console.log('posi' + currentPlayer.position);
            });

            socket.on('player jump', (currentroom, velocityData) =>
            {
                //currentPlayer.position = positionData.position; positionData,
                currentPlayer.velocity = velocityData;
                var updatedData = {
                    socketId: currentPlayer.socketId,
                    velocity: currentPlayer.velocity
                };
                io.to(currentroom.roomName).emit('player jump', updatedData);
                //   console.log('player jump ' + JSON.stringify(currentPlayer.velocity));
                //     console.log('player jump velocityData ' + JSON.stringify(velocityData));


            });

            socket.on('player turn', (currentroom, data) =>
            {
                currentPlayer.rotation = data.rotation;
                var updatedData = {
                    socketId: currentPlayer.socketId,
                    rotation: currentPlayer.rotation
                };
                io.to(currentroom.roomName).emit('player turn', updatedData);
                //console.log('player turn' + currentPlayer.rotation);

            });
            socket.on('prop change', (currentroom, data) =>
            {
                currentPlayer.propName = data.propName;
                currentPlayer.propIndex = data.propIndex;
                var updatedData = {
                    socketId: currentPlayer.socketId,
                    propName: currentPlayer.propName,
                    propIndex: currentPlayer.propIndex
                };
                io.to(currentroom.roomName).emit('prop change', updatedData);
                //   console.log('prop change ' + currentPlayer.propName);

            });
            socket.on('player shoot', (currentroom, shoot) =>
            {
                var data = {
                    socketId: currentPlayer.socketId,
                    position: shoot.position,
                    direction: shoot.direction,
                    isShooting: shoot.isShooting
                };
                io.to(currentroom.roomName).emit('player shoot', data);
            });

            socket.on('damage', (currentroom, data) =>
            {
                var indexDamaged = 0;
                rooms[currentroom.roomName].clients = rooms[currentroom.roomName].clients.map(function (client, index)
                {

                    if (client.socketId === data.from)
                    {
                        client.damage += data.damage;

                    }
                    else if (client.socketId === data.to)
                    {
                        indexDamaged = index;
                        client.health -= data.damage;
                    }
                    return client;
                });
                var response = {
                    socketId: rooms[currentroom.roomName].clients[indexDamaged].socketId,
                    health: rooms[currentroom.roomName].clients[indexDamaged].health,
                };
                io.to(currentroom.roomName).emit('damage', response);

                if (currentPlayer.socketId == data.from) currentPlayer.damage += data.damage;
                else if (currentPlayer.socketId == data.to) currentPlayer.health -= data.damage;

            });

            socket.on('disconnect', function ()
            {
                for (let roomName in rooms)
                {
                    const room = rooms[roomName];
                    const index = rooms[roomName].clients.findIndex(client => client.socketId === socket.id);
                    if (index !== -1)
                    {
                        const disconnectedPlayer = rooms[roomName].clients.splice(index, 1)[0];
                        socket.broadcast.to(roomName).emit('other player disconnected', disconnectedPlayer);
                        break;
                    }
                }
            });
        });
    }
};

function guid()
{
    function s4()
    {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function getRoomNameBySocketId(socketId)
{
    for (let roomName in rooms)
    {
        if (rooms.hasOwnProperty(roomName))
        {
            const room = rooms[roomName];
            if (room.clients.some(client => client.socketId === socketId))
            {
                return roomName;
            }
        }
    }
    return null;
}
