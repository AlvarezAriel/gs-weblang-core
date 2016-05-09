var test = require('ava');
var grammar = require('../lib/grammar');
var Parser = require('../lib/parser');
var Lexer = require('../lib/lexer');
var Names = require('../lib/gobstones-tokens-en');

var g;

test.beforeEach(function () {
    g = grammar(Parser, new Lexer(), Names);
});

test('Parser recognizes number literals', function (t) {
    var ast = g.parseExpression("1");
    t.is(ast.arity, 'literal');
    t.is(ast.value, '1');
});

test('Parser recognizes functions', function (t) {
    var ast = g.parse("procedure addition(){}");
    t.is(ast.arity, 'routine');
});
