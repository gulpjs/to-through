<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# to-through

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Wrap a ReadableStream in a TransformStream.

## Usage

```js
var from = require('from2');
var concat = require('concat-stream');
var toThrough = require('to-through');

var readable = from([' ', 'hello', ' ', 'world']);

// Can be used as a Readable or Transform
var maybeTransform = toThrough(readable);

from(['hi', ' ', 'there', ','])
  .pipe(maybeTransform)
  .pipe(
    concat(function (result) {
      // result.toString() === 'hi there, hello world'
    })
  );
```

## API

### `toThrough(readableStream)`

Takes a `readableStream` as the only argument and returns a `through2` stream. If the returned stream is piped before `nextTick`, the wrapped `readableStream` will not flow until the upstream is flushed. If the stream is not piped before `nextTick`, it is ended and flushed (acting as a proper readable).

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/to-through.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/to-through
[npm-image]: https://img.shields.io/npm/v/to-through.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/to-through/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/workflow/status/gulpjs/to-through/dev?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/to-through
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/to-through/master.svg?style=flat-square
<!-- prettier-ignore-end -->
