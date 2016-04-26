var grammar = require('../lib/grammar');
var Parser = require('../lib/parser');
var Lexer = require('../lib/lexer');

var g = grammar(Parser, new Lexer());
console.log(g.parse("function addition(){}"));

