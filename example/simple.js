
//
// Attempt to send logs before the server is listening.
//
var restream = require('../');

var server = restream.createServer(function(req, res) {

  req.on('header', function(h) {
    console.log('SERVER header', h);
  });

  req.on('data', function(chunk) {
    console.log('SERVER message %j', chunk.toString());
  });

  req.on('end', function() {
    console.log('SERVER end');
    res.header = { well: 'that was fun' };
    res.write('ok, ');
    res.end('goodbye, now');
  });
});

restream.createClient([{ port: 9967, host: '127.0.0.1' }], function(req, res) {

  req.header = { hello: 'alice', this: 'is bob' };

  res.on('header', function(h) {
    console.log('CLIENT header', h);
  });

  res.on('data', function(chunk) {
    console.log('CLIENT message %j', chunk.toString());
  });

  res.on('end', function() {
    console.log('CLIENT end');
    server.close();
  });

  req.write('this is body chunks');
  req.write('.  and it will stream and stream\n');
  req.end('because there is no I in example.\n');
});

setTimeout(function() {
  server.listen(9967);
  server.on('listening', function() {
    console.log('SERVER listening');
  });
  server.on('connection', function() {
    console.log('SERVER connected client');
  });
}, 100)
