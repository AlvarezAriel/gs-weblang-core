#!/usr/bin/env node
'use strict';
var meow = require('meow');
var gsWeblangCore = require('./');

var cli = meow([
    'Usage',
    '  $ gs-weblang-core [input]',
    '',
    'Options',
    '  --foo  Lorem ipsum. [Default: false]',
    '',
    'Examples',
    '  $ gs-weblang-core',
    '  unicorns & rainbows',
    '  $ gs-weblang-core ponies',
    '  ponies & rainbows'
]);

console.log(gsWeblangCore(cli.input[0] || 'unicorns'));
