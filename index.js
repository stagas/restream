var rs = require('readable-stream');
var net = require('net');

/**
 * Holds protocol.
 */

var _protocol;

/**
 * Set protocol to fallback to.
 *
 * @param {Object} obj
 */

exports.setProtocol = function(obj) {
  _protocol = obj;
};

/**
 * Create a server.
 *
 * Options:
 *
 * - {Object} protocol Protocol to use
 * - {Number} timeout Reconnect timeout
 * - {Number} maxReconnects Maximum number of reconnects to try
 *
 * @param {Object} [opts]
 * @param {Function} onconnection
 * @return {Server}
 * @api public
 */

exports.createServer = function(opts, onconnection) {

  // .createServer(fn)

  if (typeof opts === 'function') {
    onconnection = opts;
    opts = {};
  }

  // fallback to simple-protocol
  var protocol = opts.protocol || _protocol || require('simple-protocol');

  var server = net.createServer({ allowHalfOpen: true }, function(socket) {

    var req = new protocol.Incoming();
    var res = new protocol.Outgoing();
    res.pipe(socket).pipe(req);

    onconnection(req, res);
  });

  return server;
};

/**
 * Create a client.
 *
 * It will attempt to connect to one of
 * the `servers` using options object `opts`.
 *
 * You can pass an `onconnect` listener
 * as a shortcut to `.on('connect', onconnect)`.
 *
 * Options:
 *
 * - {Object} protocol Protocol to use
 * - {Number} timeout Reconnect timeout
 * - {Number} maxReconnects Maximum number of reconnects to try
 *
 * @param {Array} servers
 * @param {Object} [opts]
 * @param {Function} [onconnect]
 * @return {Socket}
 * @api public
 */

exports.createClient = function(servers, opts, onconnect) {

  // .createClient({ servers: [...] }, fn)

  if (!Array.isArray(servers)) {
    onconnect = opts;
    opts = servers;
    servers = opts.servers;
    if (!servers || !servers.length) {
      throw new Error('No servers to connect to!')
    }
  }

  // .createClient(servers, fn)

  if (typeof opts === 'function') {
    onconnect = opts;
    opts = {};
  }

  // fallback to simple-protocol
  var protocol = opts.protocol || _protocol || require('simple-protocol');

  var serverIndex = 0;
  var reconnectTries = 0;
  var reconnectTime = opts.timeout || 3e4;
  var maxReconnects = opts.maxReconnects || 10;
  var reconnectTimeout;

  var socket = new net.Socket;

  function connect() {

    if (reconnectTries >= maxReconnects) {

      var err = new Error('Max number of reconnects reached');
      return socket.emit('error', err);
    }

    if (serverIndex >= servers.length) {
      serverIndex = 0;
    }

    var service = servers[serverIndex];

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
    var req = new protocol.Outgoing();
    var res = new protocol.Incoming();
    req.pipe(socket).pipe(res);

    if (onconnect) {
      onconnect(req, res);
    }
  });

  connect();

  return socket;
};
