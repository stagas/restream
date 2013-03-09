var rs = require('readable-stream');
var sp = require('simple-protocol');
var net = require('net');

var Incoming = sp.Incoming;
var Outgoing = sp.Outgoing;

exports.createServer = function(opts, callback) {

  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  var server = net.createServer({ allowHalfOpen: true }, function(socket) {

    var req = new Incoming();
    var res = new Outgoing();
    res.pipe(socket).pipe(req);

    callback(req, res);

    this.close();
  });

  server._listen = server.listen;

  server.listen = function(port, callback) {
    if (typeof port === 'function') {
      callback = port;
      port = opts.port || 9967;
    }

    if (callback) {
      server._listen(port, callback);
    }
    else {
      server._listen(port);
    }
  }

  return server;
};

exports.createClient = function(opts, callback) {

  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  opts.servers = opts.servers || [{ port: 9967, host: '127.0.0.1' }];

  var serverIndex = 0;
  var reconnectTries = 0;
  var reconnectTime = opts.timeout || 3e4;
  var resetTimeout = opts.resetTimeout || 10;
  var reconnectTimeout;

  var socket = new net.Socket;

  function connect() {

    if (reconnectTries >= resetTimeout) {

      var err = new Error('Max number of reconnects reached');
      return socket.emit('error', err);
    }

    if (serverIndex >= opts.servers.length) {
      serverIndex = 0;
    }

    var service = opts.servers[serverIndex];

    socket.connect(service.port, service.host);
    socket.allowHalfOpen = true;

    serverIndex++;
    reconnectTries++;
  };

  socket.on('error', function(e) {

    if (e.code === 'ECONNREFUSED') {

      clearTimeout(reconnectTimeout);

      reconnectTimeout = setTimeout(function() {
        connect();
      }, reconnectTime * reconnectTries);
    }
  });

  socket.on('connect', function() {
    var req = new Outgoing();
    var res = new Incoming();
    req.pipe(socket).pipe(res);

    if (callback) {
      callback(req, res);
    }
  });

  connect();

  return socket;
};
