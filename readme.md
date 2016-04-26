# gs-weblang-core [![Build Status](https://travis-ci.org/AlvarezAriel/gs-weblang-core.svg?branch=master)](https://travis-ci.org/AlvarezAriel/gs-weblang-core)

> My splendid module


## Install

```
$ npm install --save gs-weblang-core
```


## Usage

```js
const gsWeblangCore = require('gs-weblang-core');

gsWeblangCore('unicorns');
//=> 'unicorns & rainbows'
```


## API

### gsWeblangCore(input, [options])

#### input

Type: `string`

Lorem ipsum.

#### options

##### foo

Type: `boolean`<br>
Default: `false`

Lorem ipsum.


## CLI

```
$ npm install --global gs-weblang-core
```

```
$ gs-weblang-core --help

  Usage
    gs-weblang-core [input]

  Options
    --foo  Lorem ipsum. [Default: false]

  Examples
    $ gs-weblang-core
    unicorns & rainbows
    $ gs-weblang-core ponies
    ponies & rainbows
```


## License

MIT © [ariel](http://gobstones.github.io)
