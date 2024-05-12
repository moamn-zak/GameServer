module.exports = {
  init: (app) =>
  {
    const io = require("socket.io")(app);
    var enemies = [];
    var playerSpawnPoints = [];
    var clients = [];

    // انتظر اتصال العميل
    io.on('connection', function (socket)
    {

      // متغير لتمثيل اللاعب الحالي
      var currentPlayer = {};
      currentPlayer.name = 'unknown';

      // عندما يتصل اللاعب بالخادم
      socket.on('player connect', function ()
      {
        console.log(currentPlayer.name + ' recv: player connect');

        // إرسال بيانات اللاعب الحالي لجميع اللاعبين الآخرين
        for (var i = 0; i < clients.length; i++)
        {
          var playerConnected = {
            socketId: clients[i].socket.id,
            name: clients[i].name,
            position: clients[i].position,
            rotation: clients[i].position,
            health: clients[i].health
          };
          // إرسال بيانات اللاعب المتصل إلى العملاء الآخرين
          socket.emit('other player connected', playerConnected);
          console.log(currentPlayer.name + ' emit: other player connected: ' + JSON.stringify(playerConnected));
        }
      });

      // عندما يبدأ اللاعب لعبة جديدة
      socket.on('play', function (data)
      {
        console.log(currentPlayer.name + ' recv: play: ' + JSON.stringify(data));

        // إذا كان هذا هو أول لاعب ينضم إلى اللعبة
        if (clients.length === 0)
        {
          numberOfEnemies = data.enemySpawnPoints.length;
          enemies = [];
          // إنشاء الأعداء وتهيئتهم
          data.enemySpawnPoints.forEach(function (enemySpawnPoint)
          {
            var enemy = {
              name: guid(),
              position: enemySpawnPoint.position,
              rotation: enemySpawnPoint.rotation,
              health: 100
            };
            enemies.push(enemy);
          });
          // تهيئة نقاط ظهور اللاعب
          playerSpawnPoints = [];
          data.playerSpawnPoints.forEach(function (_playerSpawnPoint)
          {
            var playerSpawnPoint = {
              position: _playerSpawnPoint.position,
              rotation: _playerSpawnPoint.rotation
            };
            playerSpawnPoints.push(playerSpawnPoint);
          });
        }

        // إرسال بيانات الأعداء عند البدء باللعبة
        var enemiesResponse = {
          enemies: enemies
        };
        console.log(currentPlayer.name + ' emit: enemies: ' + JSON.stringify(enemiesResponse));
        socket.emit('enemies', enemiesResponse);

        // اختيار نقطة توليد عشوائية للاعب الحالي
        var randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * playerSpawnPoints.length)];
        currentPlayer = {
          name: data.name,
          position: randomSpawnPoint.position,
          rotation: randomSpawnPoint.rotation,
          health: 100
        };
        clients.push(currentPlayer);

        // إرسال بيانات اللاعب الحالي إلى جميع العملاء
        console.log(currentPlayer.name + ' emit: play: ' + JSON.stringify(currentPlayer));
        socket.emit('play', currentPlayer);

        // إرسال بيانات اللاعب الحالي إلى العملاء الآخرين
        socket.broadcast.emit('other player connected', currentPlayer);
      });

      // عندما يقوم اللاعب بالحركة
      socket.on('player move', function (data)
      {
        console.log('recv: move: ' + JSON.stringify(data));
        currentPlayer.position = data.position;
        socket.broadcast.emit('player move', currentPlayer);
      });

      // عندما يقوم اللاعب بالدوران
      socket.on('player turn', function (data)
      {
        console.log('recv: turn: ' + JSON.stringify(data));
        currentPlayer.rotation = data.rotation;
        socket.broadcast.emit('player turn', currentPlayer);
      });

      // عندما يقوم اللاعب بإطلاق النار
      socket.on('player shoot', function ()
      {
        console.log(currentPlayer.name + ' recv: shoot');
        var data = {
          name: currentPlayer.name
        };
        console.log(currentPlayer.name + ' bcst: shoot: ' + JSON.stringify(data));
        socket.emit('player shoot', data);
        socket.broadcast.emit('player shoot', data);
      });

      // عندما يحدث تغيير في الصحة
      socket.on('health', function (data)
      {
        console.log(currentPlayer.name + ' recv: health: ' + JSON.stringify(data));
        // التحقق مما إذا كان التغيير في الصحة قد حدث بالفعل
        if (data.from === currentPlayer.name)
        {
          var indexDamaged = 0;
          if (!data.isEnemy)
          {
            // تحديث صحة اللاعب
            clients = clients.map(function (client, index)
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
            enemies = enemies.map(function (enemy, index)
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
            name: (!data.isEnemy) ? clients[indexDamaged].name : enemies[indexDamaged].name,
            health: (!data.isEnemy) ? clients[indexDamaged].health : enemies[indexDamaged].health
          };
          console.log(currentPlayer.name + ' bcst: health: ' + JSON.stringify(response));
          socket.emit('health', response);
          socket.broadcast.emit('health', response);
        }
      });

      // عند فقدان الاتصال
      socket.on('disconnect', function ()
      {
        console.log(currentPlayer.name + ' recv: disconnect ' + currentPlayer.name);
        socket.broadcast.emit('other player disconnected', currentPlayer);
        console.log(currentPlayer.name + ' bcst: other player disconnected ' + JSON.stringify(currentPlayer));
        // حذف اللاعب من القائمة عند فقده للاتصال
        for (var i = 0; i < clients.length; i++)
        {
          if (clients[i].name === currentPlayer.name)
          {
            clients.splice(i, 1);
          }
        }
      });

    });

    // دالة لتوليد رقم تعريفي فريد
    function guid()
    {
      function s4()
      {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
  }
};
