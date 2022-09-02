'use strict';

var Transform = require('streamx').Transform;

function toThrough(readable) {
  function flush(cb) {
    var self = this;

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
      var chunk;
      while ((chunk = readable.read())) {
        self.push(chunk);
      }
    }
  }

  var wrapper = new Transform({
    highWaterMark: readable._readableState.highWaterMark,
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
