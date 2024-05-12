const maxPlayersPerRoom = 2;

module.exports = {
    init: (app) =>
    {
        const io = require("socket.io")(app);
        let roomNumber = 1;
        let rooms = {};

        io.on('connection', function (socket)
        {
            const socketId = socket.id;
            var currentPlayer = {};
            console.log(`Player ${socketId} connected`);

            socket.on('join room', () =>
            {
                let roomName = `Room-${roomNumber}`;
                let room = rooms[roomName];

                // Check if the current room is full or doesn't exist
                while (!room || room.clients.length >= maxPlayersPerRoom)
                {
                    // Move to the next room
                    roomNumber++;
                    roomName = `Room-${roomNumber}`;
                    room = rooms[roomName];

                    // Create a new room if it doesn't exist
                    if (!room)
                    {
                        rooms[roomName] = {
                            clients: [],
                            enemies: [],
                            playerSpawnPoints: []
                        };
                        room = rooms[roomName];
                    }
                }

                // Add the player to the room
                socket.join(roomName);


                var playerRoomSId = {
                    roomName: roomName,
                    socketId: socketId,
                };
                console.log(`Player ${socketId} joined room ${roomName}`);
                socket.emit('getRoomSId', playerRoomSId);
            });


            // Rest of the socket event handlers
            socket.on('player connect', function (currentroom)
            {
                // const roomName = getRoomNameBySocketId(socketId);
                const roomName = currentroom.roomName;
                console.log("roomName///////////////////////" + roomName)
                let room = rooms[roomName];
                //const currentPlayerIndex = room.clients.findIndex(client => client.socketId === data.socketId);
                //const currentPlayer = room.clients[currentPlayerIndex];
                // console.log(currentPlayer.name + ' recv: player connect');
                console.log(currentroom);
                console.log(room);
                console.log("rooms[currentroom.roomName]rooms[currentroom.roomName]" + rooms[currentroom.roomName]);
                console.log(roomName);
                console.log(socket.rooms);

                // Send data of all other players to the current player in the same room
                rooms[currentroom.roomName].clients.forEach(client =>
                {
                    console.log("client.socketId::" + client.socketId + "::::socket.id:::" + socket.id)
                    if (client.socketId !== socket.id)
                    {
                        console.log("client.socketId::" + client.socketId + "::::socket.id:::" + socket.id)
                        const playerConnected = {
                            socketId: client.socketId,
                            name: client.name,
                            position: client.position,
                            rotation: client.rotation,
                            health: client.health
                        };
                        // Send data of the connecting player to other clients
                        socket.emit('other player connected', playerConnected);
                        console.log(currentroom.socketId + ' emit: other player connected: ' + JSON.stringify(playerConnected));
                    }
                });
            });

            // عندما يبدأ اللاعب لعبة جديدة
            socket.on('play', (currentroom, data) =>
            {

                console.log("currentroom" + JSON.stringify(currentroom));
                console.log("data" + JSON.stringify(data));
                console.log("///////////////////////////////////////////////////////");

                console.log(data.name + ' recv: play: ' + JSON.stringify(data));
                let room = rooms[currentroom.roomName];
                console.log("rooooooooooooooooooooooooooooms" + rooms);
                // إذا كان هذا هو أول لاعب ينضم إلى اللعبة
                if (rooms[currentroom.roomName].clients.length === 0)
                {
                    numberOfEnemies = data.enemySpawnPoints.length;
                    // room.enemies = [];
                    // إنشاء الأعداء وتهيئتهم
                    data.enemySpawnPoints.forEach(function (enemySpawnPoint)
                    {
                        var enemy = {
                            name: guid(),
                            position: enemySpawnPoint.position,
                            rotation: enemySpawnPoint.rotation,
                            health: 100
                        };
                        rooms[currentroom.roomName].enemies.push(enemy);
                    });
                    // تهيئة نقاط ظهور اللاعب
                    playerSpawnPoints = [];
                    data.playerSpawnPoints.forEach(function (_playerSpawnPoint)
                    {
                        var playerSpawnPoint = {
                            position: _playerSpawnPoint.position,
                            rotation: _playerSpawnPoint.rotation
                        };
                        rooms[currentroom.roomName].playerSpawnPoints.push(playerSpawnPoint);
                    });
                }

                // اختيار نقطة توليد عشوائية للاعب الحالي
                var randomSpawnPoint = rooms[currentroom.roomName].playerSpawnPoints[Math.floor(Math.random() * playerSpawnPoints.length)];
                currentPlayer = {
                    socketId: socket.id,
                    name: data.name,
                    position: randomSpawnPoint.position,
                    rotation: randomSpawnPoint.rotation,
                    health: 100
                };
                rooms[currentroom.roomName].clients.push(currentPlayer);
                console.log(currentPlayer.socketId + ' emsocketIdsocketIdsocketIdit: socketId: ')
                // إرسال بيانات الأعداء عند البدء باللعبة
                var enemiesResponse = {
                    enemies: room.enemies
                };
                console.log(currentPlayer.name + ' emit: enemies: ' + JSON.stringify(enemiesResponse));
                socket.emit('enemies', enemiesResponse);

                // إرسال بيانات اللاعب الحالي إلى جميع العملاء
                console.log(currentPlayer.name + ' emit: play: ' + JSON.stringify(currentPlayer));
                socket.emit('play', currentPlayer);

                // إرسال بيانات اللاعب الحالي إلى العملاء الآخرين
                io.to(currentroom.roomName).emit('other player connected', currentPlayer);

            });
            // عندما يقوم اللاعب بالحركة
            socket.on('player move', (currentroom, data) =>
            {
                //console.log('recv: move: ' + JSON.stringify(data));
                currentPlayer.position = data.position;
                io.to(currentroom.roomName).emit('player move', currentPlayer);

            });

            // عندما يقوم اللاعب بالدوران
            socket.on('player turn', (currentroom, data) =>
            {
                //console.log('recv: turn:datadatadatadata' + data.rotation);
                // console.log('recv: turn: ' + JSON.stringify(data));
                currentPlayer.rotation = data.rotation;
                // socket.broadcast.emit('player turn', currentPlayer);
                io.to(currentroom.roomName).emit('player turn', currentPlayer);
            });

            // عندما يقوم اللاعب بإطلاق النار
            socket.on('player shoot', (currentroom) =>
            {
                console.log(currentPlayer.name + ' recv: shoot');
                var data = {
                    name: currentPlayer.name
                };
                console.log(currentPlayer.name + ' bcst: shoot: ' + JSON.stringify(data));
                socket.emit('player shoot', data);
                io.to(currentroom.roomName).emit('player shoot', data);
            });

            // عندما يحدث تغيير في الصحة
            socket.on('health', (currentroom, data) =>
            {
                //let roomName = currentroom.roomName;
                console.log("csduicnsiudcnusinc         " + currentroom.roomName);
                let room = rooms[currentroom.roomName];
                console.log("unfuivndvundiuvfndiuvndifnvfdbvdfbvudvndiuvndfuiv" + rooms[currentroom.roomName].enemies);
                console.log("unfuivndvundiuvfndiuvndifnvfdbvdfbvudvndiuvndfuiv" + room.clients);
                console.log(currentPlayer.name + ' recv: health: ' + JSON.stringify(data));
                // التحقق مما إذا كان التغيير في الصحة قد حدث بالفعل
                if (data.from === currentPlayer.name)
                {
                    var indexDamaged = 0;
                    if (!data.isEnemy)
                    {
                        // تحديث صحة اللاعب
                        rooms[currentroom.roomName].clients = rooms[currentroom.roomName].clients.map(function (client, index)
                        {
                            if (client.name === data.name)
                            {
                                indexDamaged = index;
                                client.health -= data.healthChange;
                            }
                            return client;
                        });
                    } else
                    {
                        // تحديث صحة الأعداء
                        rooms[currentroom.roomName].enemies = rooms[currentroom.roomName].enemies.map(function (enemy, index)
                        {
                            if (enemy.name === data.name)
                            {
                                indexDamaged = index;
                                enemy.health -= data.healthChange;
                            }
                            return enemy;
                        });
                    }
                    // إرسال بيانات التحديثات إلى العملاء
                    var response = {
                        name: (!data.isEnemy) ? rooms[currentroom.roomName].clients[indexDamaged].name : rooms[currentroom.roomName].enemies[indexDamaged].name,
                        health: (!data.isEnemy) ? rooms[currentroom.roomName].clients[indexDamaged].health : rooms[currentroom.roomName].enemies[indexDamaged].health
                    };
                    console.log(currentPlayer.name + ' bcst: health: ' + JSON.stringify(response));
                    socket.emit('health', response);
                    io.to(currentroom.roomName).emit('health', response);
                }
            });

            socket.on('disconnect', function ()
            {
                // Remove the player from the room upon disconnection
                for (let roomName in rooms)
                {
                    const room = rooms[roomName];
                    const index = rooms[roomName].clients.findIndex(client => client.socketId === socketId);
                    if (index !== -1)
                    {
                        const disconnectedPlayer = rooms[roomName].clients.splice(index, 1)[0];
                        console.log(`Player ${socketId} left room ${roomName}`);
                        socket.broadcast.to(roomName).emit('other player disconnected', disconnectedPlayer);
                        break;
                    }
                }
            });
        });
    }
};
// دالة لتوليد رقم تعريفي فريد
function guid()
{
    function s4()
    {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
// Function to get room name by socket ID
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
    return null; // Socket ID not found in any room
}
// socket.broadcast.emit('player move', currentPlayer);
