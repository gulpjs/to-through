'use strict';

var expect = require('expect');

var toThrough = require('../');

function isStringLike(item) {
  return typeof item === 'string' || Buffer.isBuffer(item);
}

function suite(moduleName) {
  var stream = require(moduleName);

  function concat(fn, opts) {
    opts = opts || {};

    var items = [];

    return new stream.Writable(
      Object.assign({}, opts, {
        write: function (data, enc, cb) {
          if (typeof enc === 'function') {
            cb = enc;
          }

          setTimeout(function () {
            items.push(data);
            cb();
          }, opts.timeout || 1);
        },

        final: function (cb) {
          if (typeof fn === 'function') {
            if (items.every(isStringLike)) {
              fn(items.join(''));
            } else {
              fn(items);
            }
          }
          cb();
        },
      })
    );
  }

  describe('buffered (' + moduleName + ')', function () {
    // These tests ensure it automatically detects buffer mode

    var preContents = ['from', ' ', 'upstream', ' '];
    var contents = ['hello', ' ', 'world', ' ', '123'];

    it('can wrap a Readable and be used as a Readable', function (done) {
      var readable = stream.Readable.from(contents);

      function assert(result) {
        expect(result).toEqual(contents.join(''));
      }

      stream.pipeline([toThrough(readable), concat(assert)], done);
    });

    it('can watch data event', function (done) {
      var to = toThrough(stream.Readable.from(contents));
      var data = [];

      to.on('data', function (result) {
        data.push(result);
      });

      to.on('end', function () {
        expect(data.join('')).toEqual(contents.join(''));
        done();
      });
    });

    it('can wrap a Readable and be used as a Transform', function (done) {
      var readable = stream.Readable.from(contents);

      function assert(result) {
        expect(result).toEqual(contents.join(''));
      }

      stream.pipeline(
        [stream.Readable.from([]), toThrough(readable), concat(assert)],
        done
      );
    });

    it('passes through all upstream before readable', function (done) {
      var readable = stream.Readable.from(contents);

      function assert(result) {
        expect(result).toEqual(preContents.concat(contents).join(''));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents),
          toThrough(readable),
          concat(assert),
        ],
        done
      );
    });

    it('inherits the highWaterMark of the wrapped stream', function (done) {
      this.timeout(5000);

      var readable = stream.Readable.from(contents, { highWaterMark: 1 });

      function assert(result) {
        expect(result).toEqual(preContents.concat(contents).join(''));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents),
          toThrough(readable),
          concat(assert, { timeout: 250 }),
        ],
        done
      );
    });

    it('re-emits errors from readable', function (done) {
      var readable = new stream.Readable({
        read: function (cb) {
          var err = new Error('boom');
          if (typeof cb === 'function') {
            return cb(err);
          }

          this.destroy(err);
        },
      });

      function assert(err) {
        expect(err.message).toEqual('boom');
        done();
      }

      stream.pipeline(
        [stream.Readable.from(preContents), toThrough(readable), concat()],
        assert
      );
    });

    it('does not flush the stream if not piped before nextTick', function (done) {
      var readable = stream.Readable.from(contents);

      var wrapped = toThrough(readable);

      function assert(result) {
        expect(result).toEqual(preContents.concat(contents).join(''));
      }

      process.nextTick(function () {
        stream.pipeline(
          [stream.Readable.from(preContents), wrapped, concat(assert)],
          done
        );
      });
    });
  });

  describe('object mode (' + moduleName + ')', function () {
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
      var readable = stream.Readable.from(contents);

      function assert(result) {
        expect(result).toEqual(contents);
      }

      stream.pipeline(
        [toThrough(readable), concat(assert, { objectMode: true })],
        done
      );
    });

    it('can wrap a Readable and be used as a Transform', function (done) {
      var readable = stream.Readable.from(contents);

      function assert(result) {
        expect(result).toEqual(contents);
      }

      stream.pipeline(
        [
          stream.Readable.from([]),
          toThrough(readable),
          concat(assert, { objectMode: true }),
        ],
        done
      );
    });

    it('passes through all upstream before readable', function (done) {
      var readable = stream.Readable.from(contents);

      function assert(result) {
        expect(result).toEqual(preContents.concat(contents));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents),
          toThrough(readable),
          concat(assert, { objectMode: true }),
        ],
        done
      );
    });

    it('does not flush the stream if not piped before nextTick', function (done) {
      var readable = stream.Readable.from(contents);

      var wrapped = toThrough(readable);

      function assert(result) {
        expect(result).toEqual(preContents.concat(contents));
      }

      process.nextTick(function () {
        stream.pipeline(
          [
            stream.Readable.from(preContents),
            wrapped,
            concat(assert, { objectMode: true }),
          ],
          done
        );
      });
    });
  });
}

suite('stream');
suite('streamx');
suite('readable-stream');
