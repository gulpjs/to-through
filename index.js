'use strict';

var Transform = require('streamx').Transform;

function toThrough(readable) {
  function flush(cb) {
    var self = this;

    readable.on('readable', onReadable);
    // TODO: Need to cleanup
    readable.on('end', cb);
    readable.on('error', cb);

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
  readable.on('error', wrapper.emit.bind(wrapper, 'error'));

  function onPiping() {
    maybeFlow();
    this.removeListener('piping', onPiping);
    this.removeListener('newListener', onListener);
  }

  function onListener(event) {
    // Once we've seen the data or readable event, check if we need to flow
    if (event === 'data' || event === 'readable') {
      onPiping.call(this);
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
