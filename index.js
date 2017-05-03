'use strict';

var through = require('through2');

function forward(chunk, enc, cb) {
  cb(null, chunk);
}

function toThrough(readable) {

  var opts = {
    objectMode: readable._readableState.objectMode,
    highWaterMark: readable._readableState.highWaterMark,
  };

  function flush(cb) {
    var self = this;

    readable.on('readable', onReadable);
    readable.on('end', cb);

    function onReadable() {
      var chunk;
      while (chunk = readable.read()) {
        self.push(chunk);
      }
    }
  }

  var wrapper = through(opts, forward, flush);

  var shouldFlow = true;
  wrapper.on('pipe', disableFlow);
  readable.on('error', wrapper.emit.bind(wrapper, 'error'));

  function disableFlow() {
    // If the wrapper is piped, disable flow
    shouldFlow = false;
  }

  // Check if we should flow if not piped by nextTick
  process.nextTick(maybeFlow);

  function maybeFlow() {
    if (shouldFlow) {
      // Triggers flush
      wrapper.end();
    }
  }

  return wrapper;
}

module.exports = toThrough;
