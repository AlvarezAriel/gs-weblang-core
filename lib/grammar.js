function Grammar(Parser, lexer) {
    "use strict";

    var g = new Parser(lexer);

    var itself = function () {
        return this;
    };

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
        this.arity = "statement";
        return this;
    }

    function bodyStatement() {
        return (g.token.id === "{") ? g.block() : g.statement();
    }

    g.infixr("<", 40);
    g.infixr("<=", 40);
    g.infixr(">", 40);
    g.infixr(">=", 40);

    g.infix("+", 50);
    g.infix("-", 50);
    g.infix("*", 60);
    g.infix("/", 60);

    g.symbol("(end)");
    g.symbol("(name)");
    g.symbol(":");
    g.symbol(")");
    g.symbol("(");
    g.symbol("]");
    g.symbol("}");
    g.symbol(",");
    g.symbol("else");

    g.stmt(";", function () {
        return {separator: ";"};
    });

    g.assignment(":=");

    g.symbol("(literal)").nud = itself;

    g.stmt("if", function () {
        g.advance("(");
        this.condition = g.expression(0);
        g.advance(")");
        this.trueBranch = bodyStatement();
        if (g.token.id === "else") {
            g.scope.reserve(g.token);
            g.advance("else");
            this.falseBranch = bodyStatement();
        }
        this.arity = "statement";
        return this;
    });

    g.stmt("while", function () {
        this.condition = parenthesisExpression();
        this.body = bodyStatement();
        this.arity = "statement";
        return this;
    });

    g.stmt("repeat", function () {
        this.times = parenthesisExpression();
        this.body = bodyStatement();
        this.arity = "statement";
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

    g.stmt("Poner", nativeStatement);
    g.stmt("Sacar", nativeStatement);

    g.stmt("program", function () {
        this.body = g.block();
        return this;
    });

    g.stmt("function", routineParser);
    g.stmt("procedure", routineParser);

    return g;
}

module.exports = Grammar;

