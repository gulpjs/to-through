'use strict';

var expect = require('expect');
var stream = require('stream');
var streamx = require('streamx');
var concatStream = require('concat-stream');

var toThrough = require('../');

function streamxConcat(callback) {
  var results = [];

  return new streamx.Writable({
    write: function (data, cb) {
      results.push(data);
      cb();
    },

    destroy: function () {
      if (callback) {
        if (results.length > 0 && typeof results[0] === 'string') {
          results.toString = function () {
            return results.join('');
          };
        }

        callback(results);
      }
    }
  });
}

function testRunner (pipeline, Readable, concat) {
  var from = Readable.from;
  var fromObj = function (contents) {
    return from(contents, {objectMode: true});
  };

  return function () {
    describe('buffered', function () {
      // These tests ensure it automatically detects buffer mode

      var preContents = ['from', ' ', 'upstream', ' '];
      var contents = ['hello', ' ', 'world', ' ', '123'];

      it('can wrap a Readable and be used as a Readable', function (done) {
        var readable = from(contents);

        function assert(result) {
          expect(result.toString()).toEqual(contents.join(''));
        }

        pipeline([toThrough(readable), concat(assert)], done);
      });

      it('can watch data event', function (done) {
        var to = toThrough(from(contents));
        var data = [];

        to.on('data', function (result) {
          data.push(result);
        });

        to.on('end', function () {
          expect(data.join('')).toEqual(contents.join(''));
          done()
        });
      });

      it('can wrap a Readable and be used as a Transform', function (done) {
        var readable = from(contents);

        function assert(result) {
          expect(result.toString()).toEqual(contents.join(''));
        }

        pipeline([from([]), toThrough(readable), concat(assert)], done);
      });

      it('passes through all upstream before readable', function (done) {
        var readable = from(contents);

        function assert(result) {
          expect(result.toString()).toEqual(preContents.concat(contents).join(''));
        }

        pipeline([from(preContents), toThrough(readable), concat(assert)], done);
      });

      it('re-emits errors from readable', function (done) {
        var readable = new Readable({
          read: function () {
            this.emit('error', new Error('boom'));
          }
        });

        function assert(err) {
          expect(err.message).toEqual('boom');
          done();
        }

        pipeline([from(preContents), toThrough(readable), concat()], assert);
      });

      it('does not flush the stream if not piped before nextTick', function (done) {
        var readable = from(contents);

        var wrapped = toThrough(readable);

        function assert(result) {
          expect(result.toString()).toEqual(preContents.concat(contents).join(''));
        }

        process.nextTick(function () {
          pipeline([from(preContents), wrapped, concat(assert)], done);
        });
      });
    });

    describe('object mode', function () {
      // These tests ensure it automatically detects objectMode

      var preContents = [{ value: -2 }, { value: -1 }, { value: 0 }];
      var contents = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
        { value: 6 },
        { value: 7 },
        { value: 8 },
        { value: 9 },
        { value: 10 },
        { value: 11 },
        { value: 12 },
        { value: 13 },
        { value: 14 },
        { value: 15 },
        { value: 16 },
        { value: 17 },
        { value: 18 },
        { value: 19 },
        { value: 20 },
      ];

      it('can wrap a Readable and be used as a Readable', function (done) {
        var readable = fromObj(contents, {objectMode: true});

        function assert(result) {
          expect(result).toEqual(contents);
        }

        pipeline([toThrough(readable), concat(assert)], done);
      });

      it('can wrap a Readable and be used as a Transform', function (done) {
        var readable = fromObj(contents);

        function assert(result) {
          expect(result).toEqual(contents);
        }

        pipeline([fromObj([]), toThrough(readable), concat(assert)], done);
      });

      it('passes through all upstream before readable', function (done) {
        var readable = fromObj(contents);

        function assert(result) {
          expect(result).toEqual(preContents.concat(contents));
        }

        pipeline([fromObj(preContents), toThrough(readable), concat(assert)], done);
      });

      it('does not flush the stream if not piped before nextTick', function (done) {
        var readable = fromObj(contents);

        var wrapped = toThrough(readable);

        function assert(result) {
          expect(result).toEqual(preContents.concat(contents));
        }

        process.nextTick(function () {
          pipeline([fromObj(preContents), wrapped, concat(assert)], done);
        });
      });
    });
  };
}

describe('stream.pipeline with stream.Readable, concatStream', testRunner(stream.pipeline, stream.Readable, concatStream));
describe('stream.pipeline with stream.Readable, streamxConcat', testRunner(stream.pipeline, stream.Readable, streamxConcat));

describe('stream.pipeline with streamx.Readable, concatStream', testRunner(stream.pipeline, streamx.Readable, concatStream));
describe('stream.pipeline with streamx.Readable, streamxConcat', testRunner(stream.pipeline, streamx.Readable, streamxConcat));
