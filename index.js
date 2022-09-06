'use strict';

var Transform = require('streamx').Transform;

function toThrough(readable) {
  function flush(cb) {
    var self = this;

    var done = false;

    // all writes drained, so change the read impl now
    self._read = function (cb) {
      readable.resume();
      cb();
    };

    readable.on('data', onData);
    readable.on('end', onDone);
    readable.on('error', onDone);

    function onData(data) {
      // when push returns false it'll call _read later
      var drained = self.push(data);
      console.log('drained?', drained);
      if (!drained) {
        readable.pause();
      }
    }

    function onDone(err) {
      if (done) return;
      done = true;
      cb(err);
    }
  }

  // Streamx uses `16384` as the default highWaterMark and then it divides it by 1024 for objects
  var highWaterMark = 16 * 1024;
  // However, node's objectMode streams the number of objects as highWaterMark, so we need to
  // multiply the objectMode highWaterMark by 1024 to make it streamx compatible
  if (readable._readableState.objectMode) {
    highWaterMark = readable._readableState.highWaterMark * 1024;
  } else {
    highWaterMark = readable._readableState.highWaterMark;
  }

  var wrapper = new Transform({
    highWaterMark: highWaterMark,
    flush: flush,
    predestroy: function () {
      // hook called if the user destroys this stream explicitly
      readable.destroy(new Error('Wrapper destroyed'));
    },
  });

  // forward errors
  readable.on('error', function (err) {
    wrapper.destroy(err);
  });

  var shouldFlow = true;
  wrapper.once('pipe', onPipe);
  wrapper.on('piping', onPiping);
  wrapper.on('newListener', onListener);

  function onPiping() {
    maybeFlow();
    wrapper.off('piping', onPiping);
    wrapper.off('newListener', onListener);
  }

  function onListener(event) {
    // Once we've seen the data or readable event, check if we need to flow
    if (event === 'data' || event === 'readable') {
      onPiping();
    }
  }

  function onPipe() {
    // If the wrapper is piped, disable flow
    shouldFlow = false;
  }

  function maybeFlow() {
    // If we need to flow, end the stream which triggers flush
    if (shouldFlow) {
      wrapper.end();
    }
  }

  return wrapper;
}

module.exports = toThrough;
