
# NAME
restream(3)

# SYNOPSIS
simple-protocol over tcp with reconnect robustness

# EXAMPLES

## Create a Server
```js
var restream = require('restream');
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
```

## Create a Client
```js
restream.createClient(function(req, res) {

  req.header = { hello: 'alice', this: 'is bob' };

  res.on('header', function(h) {
    console.log('CLIENT header', h);
  });

  res.on('data', function(chunk) {
    console.log('CLIENT message %j', chunk.toString());
  });

  res.on('end', function() {
    console.log('CLIENT end');
  });

  req.write('this is body chunks');
  req.write('.  and it will stream and stream\n');
  req.end('because there is no I in example.\n');
});
```

## Start listening in any order
```js
server.listen();
```

The output from the above code
```
SERVER header { hello: 'alice', this: 'is bob' }
SERVER message "this is body chunks.  and it will stream and stream\nbecause there is no I in example.\n"
SERVER end
CLIENT header { well: 'that was fun' }
CLIENT message "ok, goodbye, now"
CLIENT end
```

# API

## createServer([options], [callback])

### [callback] `function(req, res)`
A callback that is called once a connection is established. The callback yields
request and response streams that are readable and writable.

## createClient([options], [callback])

### [options] `{ timeout: <Number> }`
An optional number to determine how long before attempting the next reconnection. 
Defaults to `3e4`. Note that this number is multiplied by the number of failures
to connect.

### [options] `{ resetTimeout: <Number> }`
Since the timeout is multiplied by the number of failures to connect, this 
option provides a limit for how long the wait can become. The value represents
the number of failures before a reset should happen.

### [options] `{ servers: <Object> }`
An array that contains a list of servers. Each object in the array should 
contain a `port` and `host` address. When a connection can't be made to a 
server, the next server in the array is selected for the reconnect attempt.

### [callback] `function(req, res)`
A callback that is called once a connection is established. The callback yields
request and response streams that are readable and writable.
