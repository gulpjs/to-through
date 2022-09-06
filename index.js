'use strict';

var Duplex = require('streamx').Duplex;

function toThrough(readable) {
  var highWaterMark = readable._readableState.highWaterMark;

  // Streamx uses 16384 as the default highWaterMark for everything and then
  // divides it by 1024 for objects
  // However, node's objectMode streams the number of objects as highWaterMark, so we need to
  // multiply the objectMode highWaterMark by 1024 to make it streamx compatible
  if (readable._readableState.objectMode) {
    highWaterMark = readable._readableState.highWaterMark * 1024;
  }

  var writeFinished = false;
  var readableEnded = false;
  var readableErr;

  readable.once('end', function () {
    readableEnded = true;
  });

  readable.once('error', function (err) {
    readableErr = err;
  });

  function read(cb) {
    var self = this;

    // If we aren't done writing, then we no-op the read until all the upstream data is written
    if (!writeFinished) {
      return cb();
    }

    // If the readable stream was marked ended between reads, the `end` event won't be
    // handled, so we check the ended state early and bail
    if (readableEnded) {
      self.push(null);
      return cb();
    }

    // If the readable stream errored between reads, the `error` event won't be
    // handled, so we check the error state early and bail
    if (readableErr) {
      return cb(readableErr);
    }

    function cleanup() {
      readable.off('readable', onReadable);
      readable.off('end', onEnd);
    }

    function onEnd() {
      cleanup();
      self.push(null);
      cb();
    }

    function onRead(chunk) {
      self.push(chunk);
      cleanup();
      cb();
    }

    function onReadable() {
      // Once `readable`, we need to grab the first chunk before passing it to onRead
      var chunk = readable.read();
      onRead(chunk);
    }

    var chunk = readable.read();

    readable.once('end', onEnd);

    if (chunk !== null) {
      onRead(chunk);
    } else {
      // If the first chunk is null we want to wait for `readable` to handle a backpressured stream
      readable.once('readable', onReadable);
    }
  }

  // We want to push the data along as it comes
  function write(data, cb) {
    this.push(data);
    cb();
  }

  function final(cb) {
    var self = this;

    function cleanup() {
      readable.off('end', onEnd);
      readable.off('error', onError);
      readable.off('readable', onReadable);
    }

    function onEnd() {
      cleanup();
      self.push(null);
      cb();
    }

    function onError(err) {
      cleanup();
      cb(err);
    }

    function onReadable() {
      writeFinished = true;
      var chunk = readable.read();
      self.push(chunk);
      cleanup();
      cb();
    }

    readable.once('end', onEnd);
    readable.once('error', onError);
    readable.once('readable', onReadable);
  }

  var wrapper = new Duplex({
    highWaterMark: highWaterMark,
    read: read,
    write: write,
    final: final,
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
