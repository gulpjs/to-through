'use strict';

var Transform = require('streamx').Transform;

function toThrough(readable) {
  function flush(cb) {
    var self = this;

    // If we are being piped to an output stream, we want to listen for
    // `drain` events to adhere to our highWaterMark
    if (self._readableState.pipeTo) {
      self._readableState.pipeTo.on('drain', onReadable);
    }

    readable.on('readable', onReadable);
    readable.on('end', onEnd);
    readable.on('error', onError);

    function cleanup() {
      readable.off('readable', onReadable);
      readable.off('end', onEnd);
      readable.off('error', onError);
    }

    function onEnd() {
      cleanup();
      cb();
    }

    function onError(err) {
      cleanup();
      cb(err);
    }

    function onReadable() {
      var chunk = readable.read();
      var drained = true;
      while (chunk !== null && drained) {
        drained = self.push(chunk);
        if (drained) {
          chunk = readable.read();
        }
      }
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
