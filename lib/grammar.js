function Grammar(Parser, lexer, names, behaviour) {
    "use strict";

    var n = names;
    var b = behaviour;
    var g = new Parser(lexer);

    function operator(op, bp, f) {
        g.infix(op, bp, function (left) {
            var self = this;
            this.left = left;
            this.right = g.expression(bp);
            this.arity = "binary";
            this.eval = function (context) {
                return f(self.right.eval(context), self.left.eval(context));
            };
            return this;
        });
    }

    function parameterList() {
        var parameters = [];
        g.advance("(");
        if (g.token.id !== ")") {
            for (; ;) {
                if (g.token.arity !== "name") {
                    g.error(g.token, "Expected a parameter name.");
                }
                g.scope.define(g.token);
                parameters.push(g.token);
                g.advance();
                if (g.token.id !== ",") {
                    break;
                }
                g.advance(",");
            }
        }
        g.advance(")");
        return parameters;
    }

    function routineParser() {
        g.newScope();
        if (g.token.arity === "name") {
            g.scope.define(g.token);
            this.name = g.token.value;
            g.advance();
        }
        this.parameters = parameterList();
        this.body = bodyStatement();
        this.arity = "routine";
        g.scope.pop();
        this.std = function () {
            return this;
        };
        return this;
    }

    function parenthesisExpression() {
        "use strict";
        g.advance("(");
        var p = g.expression(0);
        g.advance(")");
        return p;
    }

    function nativeStatement() {
        this.parameter = parenthesisExpression();
        return this;
    }

    function bodyStatement() {
        return (g.token.id === "{") ? g.block() : g.statement();
    }

    g.infixr("<", 40);
    g.infixr("<=", 40);
    g.infixr(">", 40);
    g.infixr(">=", 40);

    g.infix("+", 50, function (left) {
        this.left = left;
        this.right = g.expression(50);
        this.arity = "binary";
        this.eval = function (context) {
            return this.right.eval(context) + this.left.eval(context);
        };
        return this;
    });

    operator("+", 50, function (x, y) {
        return x + y;
    });
    operator("-", 50, function (x, y) {
        return x - y;
    });
    operator("*", 60, function (x, y) {
        return x * y;
    });
    operator("/", 60, function (x, y) {
        return x / y;
    });

    g.symbol("(end)");

    g.symbol(":");
    g.symbol(")");
    g.symbol("(");
    g.symbol("]");
    g.symbol("}");
    g.symbol(",");
    g.symbol(n.ELSE);

    g.constant(n.FALSE, false);
    g.constant(n.TRUE, true);
    g.constant(n.RED, 'red');
    g.constant(n.BLUE, 'blue');
    g.constant(n.BLACK, 'black');
    g.constant(n.GREEN, 'green');

    g.stmt(";", function () {
        return {separator: ";"};
    });

    g.infixr(":=", 10, function (left) {
        if (left.id !== "." && left.id !== "[" && left.arity !== "name") {
            g.error(left, "Bad lvalue.");
        }
        return b.assignment(left, g.expression(9));
    });

    g.symbol("(literal)").nud = b.literal();
    g.symbol("(name)").nud = b.variable();

    g.stmt(n.IF, function () {
        g.advance("(");
        var condition = g.expression(0);
        g.advance(")");
        var trueBranch = bodyStatement();
        var falseBranch = null;
        if (g.token.id === n.ELSE) {
            g.scope.reserve(g.token);
            g.advance(n.ELSE);
            falseBranch = bodyStatement();
        }
        return b.conditional(condition, trueBranch, falseBranch);
    });

    g.stmt(n.WHILE, function () {
        this.condition = parenthesisExpression();
        this.body = bodyStatement();
        return this;
    });

    g.stmt(n.REPEAT, function () {
        this.times = parenthesisExpression();
        this.body = bodyStatement();
        return this;
    });

    g.stmt("{", function () {
        var a = g.statements();
        g.advance("}");
        return a;
    });

    g.stmt("(", function () {
        var a = g.statements();
        g.advance(")");
        return a;
    });

    g.stmt(n.PUT, nativeStatement);
    g.stmt(n.REMOVE, nativeStatement);

    g.stmt(n.PROGRAM, function () {
        this.body = g.block();
        return this;
    });

    g.stmt(n.FUNCTION, routineParser);
    g.stmt(n.PROCEDURE, routineParser);
    g.stmt(n.RETURN, function () {
        if (g.token.id !== ";") {
            this.expression = g.expression(0);
        }
        return this;
    });
    return g;
}

module.exports = Grammar;

