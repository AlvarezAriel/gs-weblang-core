var test = require('ava');
var fn = require('../index.js');

test('title', function (t) {
    t.is(fn('unicorns'), 'unicorns & rainbows');
});
