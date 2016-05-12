var grammar = require('../lib/grammar');
var Parser = require('../lib/parser');
var Lexer = require('../lib/lexer');
var Names = require('../lib/gobstones-tokens-en');
var behaviors = require('../lib/interpreter');
var Context = require('../lib/execution-context');

var g = grammar(Parser, new Lexer(), Names, behaviors);
// console.log(g.parseExpression("6+2*3").eval());
var context = new Context();
var programm = g.parse("procedure Sarlompa(){}");
for (var i = 0; i < programm.length; i++) {
    programm[i].interpret(context);
}
console.log(g.parse("procedure Sarlompa(x,y){  z := x + y  }"));
console.log(context.all());

