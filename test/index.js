'use strict';

var expect = require('expect');

var miss = require('mississippi');

var toThrough = require('../');

var from = miss.from;
var pipe = miss.pipe;
var concat = miss.concat;

describe('toThrough (buffer mode)', function () {
  // These tests ensure it automatically detects buffer mode

  var preContents = ['from', ' ', 'upstream', ' '];
  var contents = ['hello', ' ', 'world', ' ', '123'];

  it('can wrap a Readable and be used as a Readable', function (done) {
    var readable = from(contents);

    function assert(result) {
      expect(result.toString()).toEqual(contents.join(''));
    }

    pipe([toThrough(readable), concat(assert)], done);
  });

  it('can wrap a Readable and be used as a Transform', function (done) {
    var readable = from(contents);

    function assert(result) {
      expect(result.toString()).toEqual(contents.join(''));
    }

    pipe([from([]), toThrough(readable), concat(assert)], done);
  });

  it('passes through all upstream before readable', function (done) {
    var readable = from(contents);

    function assert(result) {
      expect(result.toString()).toEqual(preContents.concat(contents).join(''));
    }

    pipe([from(preContents), toThrough(readable), concat(assert)], done);
  });

  it('re-emits errors from readable', function (done) {
    var readable = from([new Error('boom')]);

    function assert(err) {
      expect(err.message).toEqual('boom');
      done();
    }

    pipe([from(preContents), toThrough(readable), concat()], assert);
  });

  it('does not flush the stream if not piped before nextTick', function (done) {
    var readable = from(contents);

    var wrapped = toThrough(readable);

    function assert(result) {
      expect(result.toString()).toEqual(preContents.concat(contents).join(''));
    }

    process.nextTick(function () {
      pipe([from(preContents), wrapped, concat(assert)], done);
    });
  });
});

describe('toThrough (object mode)', function () {
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
    var readable = from.obj(contents);

    function assert(result) {
      expect(result).toEqual(contents);
    }

    pipe([toThrough(readable), concat(assert)], done);
  });

  it('can wrap a Readable and be used as a Transform', function (done) {
    var readable = from.obj(contents);

    function assert(result) {
      expect(result).toEqual(contents);
    }

    pipe([from.obj([]), toThrough(readable), concat(assert)], done);
  });

  it('passes through all upstream before readable', function (done) {
    var readable = from.obj(contents);

    function assert(result) {
      expect(result).toEqual(preContents.concat(contents));
    }

    pipe([from.obj(preContents), toThrough(readable), concat(assert)], done);
  });

  it('does not flush the stream if not piped before nextTick', function (done) {
    var readable = from.obj(contents);

    var wrapped = toThrough(readable);

    function assert(result) {
      expect(result).toEqual(preContents.concat(contents));
    }

    process.nextTick(function () {
      pipe([from.obj(preContents), wrapped, concat(assert)], done);
    });
  });
});
