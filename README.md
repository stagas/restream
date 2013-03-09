
# NAME
restream(3)

# SYNOPSIS
simple-protocol with reconnect robustness

# EXAMPLES

```js
var server = exports.createServer(function(req, res) {

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

exports.createClient(function(req, res) {

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

server.listen(function() {});
```
