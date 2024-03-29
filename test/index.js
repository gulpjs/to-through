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
      var readable = stream.Readable.from(contents, { objectMode: false });

      function assert(result) {
        expect(result).toEqual(contents.join(''));
      }

      stream.pipeline([toThrough(readable), concat(assert)], done);
    });

    it('can watch data event', function (done) {
      var to = toThrough(stream.Readable.from(contents, { objectMode: false }));
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
      var readable = stream.Readable.from(contents, { objectMode: false });

      function assert(result) {
        expect(result).toEqual(contents.join(''));
      }

      stream.pipeline(
        [
          stream.Readable.from([], { objectMode: false }),
          toThrough(readable),
          concat(assert),
        ],
        done
      );
    });

    it('can wrap an empty Readable and be used as a Transform', function (done) {
      var readable = stream.Readable.from([], { objectMode: false });

      function assert(result) {
        expect(result).toEqual(preContents.join(''));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents, { objectMode: false }),
          toThrough(readable),
          concat(assert),
        ],
        done
      );
    });

    it('passes through all upstream before readable', function (done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

      function assert(result) {
        expect(result).toEqual(preContents.concat(contents).join(''));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents, { objectMode: false }),
          toThrough(readable),
          concat(assert),
        ],
        done
      );
    });

    it('re-emits errors from readable before data', function (done) {
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
        [
          stream.Readable.from(preContents, { objectMode: false }),
          toThrough(readable),
          concat(),
        ],
        assert
      );
    });

    it('re-emits errors from readable after some data', function (done) {
      var items = ['hello'];
      var readable = new stream.Readable({
        read: function (cb) {
          var chunk = items.shift();
          if (chunk) {
            this.push(chunk);
            if (typeof cb === 'function') {
              cb();
            }
            return;
          }

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
        [
          stream.Readable.from(preContents, { objectMode: false }),
          toThrough(readable),
          concat(),
        ],
        assert
      );
    });

    it('does not flush the stream if not piped before nextTick', function (done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

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

    it('destroys the readable if the wrapper is destroyed', function (done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

      var wrapped = toThrough(readable);

      readable.on('error', function (err) {
        expect(err.message).toEqual('Wrapper destroyed');
        done();
      });

      wrapped.destroy();
    });

    it('destroys the wrapper if the readable is destroyed', function (done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

      var wrapped = toThrough(readable);

      wrapped.on('close', function () {
        expect(wrapped.destroyed).toEqual(true);
        done();
      });
      readable.on('error', function (err) {
        // To ensure another error isn't surfaced
        expect(err).toBeUndefined();
      });

      readable.destroy();
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

    it('inherits the highWaterMark of the wrapped stream', function (done) {
      this.timeout(10000);

      var readable = stream.Readable.from(contents, {
        highWaterMark: moduleName === 'streamx' ? 1024 : 1,
      });

      function assert(result) {
        expect(result).toEqual(preContents.concat(contents));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents),
          toThrough(readable),
          concat(assert, { objectMode: true, timeout: 250 }),
        ],
        done
      );
    });

    it('respects highWaterMark of the output stream', function (done) {
      this.timeout(10000);

      var readable = stream.Readable.from(contents);

      function assert(result) {
        expect(result).toEqual(preContents.concat(contents));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents),
          toThrough(readable),
          concat(assert, { highWaterMark: 1, objectMode: true, timeout: 250 }),
        ],
        done
      );
    });

    it('respects highWaterMark of itself and the output stream', function (done) {
      this.timeout(10000);

      var readable = stream.Readable.from(contents, {
        highWaterMark: moduleName === 'streamx' ? 1024 : 1,
      });

      function assert(result) {
        expect(result).toEqual(preContents.concat(contents));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents),
          toThrough(readable),
          concat(assert, { highWaterMark: 1, objectMode: true, timeout: 250 }),
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
