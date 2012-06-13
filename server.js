var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8008);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
    var room = false;

    socket.on('event', _p(function(data) {
        socket.broadcast.to(data.room).emit('event', data);
    }));

    socket.on('join', _p(function(data) {
        var num_connected = io.sockets.clients(data.room).length;
        if(num_connected >= 2) {
            socket.emit('join_status', {'result': false, 'reason': 'The room is already full'});
            room = false;
        } else {
            socket.emit('join_status', {'result': true});
            socket.join(data.room);
            socket.broadcast.to(data.room).emit('event',
                {'type': 'join',
                 'who': data.who});
        }
    }));

    socket.on('disconnect', function () {
        if(room) {
            socket.broadcast.to(room).emit('event', {'type': 'disconnect'});
        }
    });

    socket.on('chat', _p(function(data) {
        io.sockets.in(data.room).emit('chat', data);
    }));

    function _p(callback) {
        return function(data) {
            if(typeof data == "string") {
                data = JSON.parse(data)[0];
            }
            if(data.room) room = data.room;
            callback(data);
        }
    }
});
