"use strict";

var assert = require("node:assert");
var { describe, it } = require("node:test");

var toThrough = require("../");

function isStringLike(item) {
  return typeof item === "string" || Buffer.isBuffer(item);
}

function suite(moduleName) {
  var stream = require(moduleName);

  function concat(fn, opts) {
    opts = opts || {};

    var items = [];

    return new stream.Writable(
      Object.assign({}, opts, {
        write: function (data, enc, cb) {
          if (typeof enc === "function") {
            cb = enc;
          }

          setTimeout(function () {
            items.push(data);
            cb();
          }, opts.timeout || 1);
        },

        final: function (cb) {
          if (typeof fn === "function") {
            if (items.every(isStringLike)) {
              fn(items.join(""));
            } else {
              fn(items);
            }
          }
          cb();
        },
      }),
    );
  }

  describe("buffered (" + moduleName + ")", function () {
    // These tests ensure it automatically detects buffer mode

    var preContents = ["from", " ", "upstream", " "];
    var contents = ["hello", " ", "world", " ", "123"];

    it("can wrap a Readable and be used as a Readable", function (t, done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

      function assertion(result) {
        assert.strictEqual(result, contents.join(""));
      }

      stream.pipeline([toThrough(readable), concat(assertion)], done);
    });

    it("can watch data event", function (t, done) {
      var to = toThrough(stream.Readable.from(contents, { objectMode: false }));
      var data = [];

      to.on("data", function (result) {
        data.push(result);
      });

      to.on("end", function () {
        assert.strictEqual(data.join(""), contents.join(""));
        done();
      });
    });

    it("can wrap a Readable and be used as a Transform", function (t, done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

      function assertion(result) {
        assert.strictEqual(result, contents.join(""));
      }

      stream.pipeline(
        [
          stream.Readable.from([], { objectMode: false }),
          toThrough(readable),
          concat(assertion),
        ],
        done,
      );
    });

    it("can wrap an empty Readable and be used as a Transform", function (t, done) {
      var readable = stream.Readable.from([], { objectMode: false });

      function assertion(result) {
        assert.strictEqual(result, preContents.join(""));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents, { objectMode: false }),
          toThrough(readable),
          concat(assertion),
        ],
        done,
      );
    });

    it("passes through all upstream before readable", function (t, done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

      function assertion(result) {
        assert.strictEqual(result, preContents.concat(contents).join(""));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents, { objectMode: false }),
          toThrough(readable),
          concat(assertion),
        ],
        done,
      );
    });

    it("re-emits errors from readable before data", function (t, done) {
      var readable = new stream.Readable({
        read: function (cb) {
          var err = new Error("boom");
          if (typeof cb === "function") {
            return cb(err);
          }

          this.destroy(err);
        },
      });

      function assertion(err) {
        assert.strictEqual(err.message, "boom");
        done();
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents, { objectMode: false }),
          toThrough(readable),
          concat(),
        ],
        assertion,
      );
    });

    it("re-emits errors from readable after some data", function (t, done) {
      var items = ["hello"];
      var readable = new stream.Readable({
        read: function (cb) {
          var chunk = items.shift();
          if (chunk) {
            this.push(chunk);
            if (typeof cb === "function") {
              cb();
            }
            return;
          }

          var err = new Error("boom");
          if (typeof cb === "function") {
            return cb(err);
          }

          this.destroy(err);
        },
      });

      function assertion(err) {
        assert.strictEqual(err.message, "boom");
        done();
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents, { objectMode: false }),
          toThrough(readable),
          concat(),
        ],
        assertion,
      );
    });

    it("does not flush the stream if not piped before nextTick", function (t, done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

      var wrapped = toThrough(readable);

      function assertion(result) {
        assert.strictEqual(result, preContents.concat(contents).join(""));
      }

      process.nextTick(function () {
        stream.pipeline(
          [stream.Readable.from(preContents), wrapped, concat(assertion)],
          done,
        );
      });
    });

    it("destroys the readable if the wrapper is destroyed", function (t, done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

      var wrapped = toThrough(readable);

      readable.on("error", function (err) {
        assert.strictEqual(err.message, "Wrapper destroyed");
        done();
      });

      wrapped.destroy();
    });

    it("destroys the wrapper if the readable is destroyed", function (t, done) {
      var readable = stream.Readable.from(contents, { objectMode: false });

      var wrapped = toThrough(readable);

      wrapped.on("close", function () {
        assert.strictEqual(wrapped.destroyed, true);
        done();
      });
      readable.on("error", function (err) {
        // To ensure another error isn't surfaced
        assert.strictEqual(err, false);
      });

      readable.destroy();
    });
  });

  describe("object mode (" + moduleName + ")", function () {
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

    it("can wrap a Readable and be used as a Readable", function (t, done) {
      var readable = stream.Readable.from(contents);

      function assertion(result) {
        assert.deepStrictEqual(result, contents);
      }

      stream.pipeline(
        [toThrough(readable), concat(assertion, { objectMode: true })],
        done,
      );
    });

    it("can wrap a Readable and be used as a Transform", function (t, done) {
      var readable = stream.Readable.from(contents);

      function assertion(result) {
        assert.deepStrictEqual(result, contents);
      }

      stream.pipeline(
        [
          stream.Readable.from([]),
          toThrough(readable),
          concat(assertion, { objectMode: true }),
        ],
        done,
      );
    });

    it("passes through all upstream before readable", function (t, done) {
      var readable = stream.Readable.from(contents);

      function assertion(result) {
        assert.deepStrictEqual(result, preContents.concat(contents));
      }

      stream.pipeline(
        [
          stream.Readable.from(preContents),
          toThrough(readable),
          concat(assertion, { objectMode: true }),
        ],
        done,
      );
    });

    it(
      "inherits the highWaterMark of the wrapped stream",
      { timeout: 10000 },
      function (t, done) {
        var readable = stream.Readable.from(contents, {
          highWaterMark: moduleName === "streamx" ? 1024 : 1,
        });

        function assertion(result) {
          assert.deepStrictEqual(result, preContents.concat(contents));
        }

        stream.pipeline(
          [
            stream.Readable.from(preContents),
            toThrough(readable),
            concat(assertion, { objectMode: true, timeout: 250 }),
          ],
          done,
        );
      },
    );

    it(
      "respects highWaterMark of the output stream",
      { timeout: 10000 },
      function (t, done) {
        var readable = stream.Readable.from(contents);

        function assertion(result) {
          assert.deepStrictEqual(result, preContents.concat(contents));
        }

        stream.pipeline(
          [
            stream.Readable.from(preContents),
            toThrough(readable),
            concat(assertion, {
              highWaterMark: 1,
              objectMode: true,
              timeout: 250,
            }),
          ],
          done,
        );
      },
    );

    it(
      "respects highWaterMark of itself and the output stream",
      { timeout: 10000 },
      function (t, done) {
        var readable = stream.Readable.from(contents, {
          highWaterMark: moduleName === "streamx" ? 1024 : 1,
        });

        function assertion(result) {
          assert.deepStrictEqual(result, preContents.concat(contents));
        }

        stream.pipeline(
          [
            stream.Readable.from(preContents),
            toThrough(readable),
            concat(assertion, {
              highWaterMark: 1,
              objectMode: true,
              timeout: 250,
            }),
          ],
          done,
        );
      },
    );

    it("does not flush the stream if not piped before nextTick", function (t, done) {
      var readable = stream.Readable.from(contents);

      var wrapped = toThrough(readable);

      function assertion(result) {
        assert.deepStrictEqual(result, preContents.concat(contents));
      }

      process.nextTick(function () {
        stream.pipeline(
          [
            stream.Readable.from(preContents),
            wrapped,
            concat(assertion, { objectMode: true }),
          ],
          done,
        );
      });
    });
  });
}

suite("stream");
suite("streamx");
suite("readable-stream");
