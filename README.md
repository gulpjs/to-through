<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# to-through

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Wrap a `Readable` stream in a `Transform` stream.

## Usage

```js
var { Readable } = require("streamx");
var concat = require("concat-stream");
var toThrough = require("to-through");

var readable = Readable.from([" ", "hello", " ", "world"]);

// Can be used as a Readable or Transform
var maybeTransform = toThrough(readable);

Readable.from(["hi", " ", "there", ","])
  .pipe(maybeTransform)
  .pipe(
    concat(function (result) {
      // result === 'hi there, hello world'
    }),
  );
```

## API

### `toThrough(readableStream)`

Takes a `Readable` stream as the only argument and returns a `Transform` stream wrapper. Any data
piped into the `Transform` stream is piped passed along before any data from the wrapped `Readable` is injected into the stream.

## Strict No LLM / No AI Policy

No LLMs for issues.

No LLMs for patches / pull requests.

No LLMs for comments on the bug tracker, including translation.

English is encouraged, but not required. You are welcome to post in your native language and rely on others to have their own translation tools of choice to interpret your words.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/to-through.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/to-through
[npm-image]: https://img.shields.io/npm/v/to-through.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/to-through/actions/workflows/dev.yml
[ci-image]: https://img.shields.io/github/actions/workflow/status/gulpjs/to-through/dev.yml?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/to-through
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/to-through/main.svg?style=flat-square
<!-- prettier-ignore-end -->
