function Parser(lexer) {
    this.scope = null;
    this.token = null;
    this.tokens = lexer;
    var self = this;

    var symbolTable = {};

    this.error = function (token, description) {
        var someError = {error: description, on: token};
        console.log("PARSER ERROR: ", someError);
        throw someError;
    };

    var OriginalSymbol = {
        nud: function () {
            self.error(this, "Undefined.");
        },
        led: function () {
            self.error(this, "Missing operator.");
        }
    };

    var itself = function () {
        return this;
    };

    var originalScope = {
        define: function (name) {
            var t = this.def[name.value];
            if (typeof t === "object") {
                self.error(name, t.reserved ? "Already reserved." : "Already defined.");
            }
            this.def[name.value] = name;
            name.reserved = false;
            name.nud = itself;
            name.led = null;
            name.std = null;
            name.lbp = 0;
            name.scope = self.scope;
            return name;
        },
        find: function (name) {
            var e = this;
            var targetToken;
            for (; ;) {
                targetToken = e.def[name];
                if (targetToken && typeof targetToken !== 'function') {
                    return e.def[name];
                }
                e = e.parent;
                if (!e) {
                    targetToken = symbolTable[name];
                    return targetToken && typeof targetToken !== 'function' ? targetToken : symbolTable["(name)"];
                }
            }
        },
        pop: function () {
            this.scope = this.parent;
        },
        reserve: function (name) {
            if (name.arity !== "name" || name.reserved) {
                return;
            }
            var t = this.def[name.value];
            if (t) {
                if (t.reserved) {
                    return;
                }
                if (t.arity === "name") {
                    name.error("Already defined.");
                }
            }
            this.def[name.value] = name;
            name.reserved = true;
        }
    };

    this.newScope = function () {
        var s = self.scope;
        self.scope = Object.create(originalScope);
        self.scope.def = {};
        self.scope.parent = s;
        return self.scope;
    };

    this.symbol = function (id, bindingPower) {
        var s = symbolTable[id];
        bindingPower = bindingPower || 0;
        if (s) {
            if (bindingPower >= s.lbp) {
                s.lbp = bindingPower;
            }
        } else {
            s = Object.create(OriginalSymbol);
            s.id = s.value = id;
            s.lbp = bindingPower;
            symbolTable[id] = s;
        }
        return s;
    };

    this.expression = function (rightBindingPower) {
        var left;
        var t = self.token;
        this.advance();
        left = t.nud();
        while (rightBindingPower < self.token.lbp) {
            t = self.token;
            this.advance();
            left = t.led(left);
        }
        return left;
    };

    this.constant = function (symbol, value) {
        var x = this.symbol(symbol);
        x.nud = function () {
            self.scope.reserve(this);
            this.value = symbolTable[this.id].value;
            this.arity = "literal";
            this.eval = function () {
                return value;
            };
            return this;
        };
        x.value = value;
        return x;
    };

    this.infix = function (id, bp, led) {
        var s = this.symbol(id, bp);
        s.led = led || function (left) {
            this.left = left;
            this.right = self.expression(bp);
            this.arity = "binary";
            return this;
        };
        return s;
    };

    this.infixr = function (id, bp, led) {
        var s = this.symbol(id, bp);
        s.led = led || function (left) {
            this.left = left;
            this.right = self.expression(bp - 1);
            this.arity = "binary";
            return this;
        };
        return s;
    };

    this.prefix = function (id, nud) {
        var s = this.symbol(id);
        s.nud = nud || function () {
            // scope.reserve(this);
            this.left = self.expression(70);
            this.arity = "unary";
            return this;
        };
        return s;
    };

    this.stmt = function (symbol, f) {
        var x = this.symbol(symbol);
        x.std = f;
        return x;
    };

    /**
     * The advance function fetches the next token,
     * generating the corresponding symbol from the definitions on symbolTable
     *
     * @param id. Token ID
     * @returns Token
     */
    this.advance = function (id) {
        var a;
        var o;
        var t;
        var v;
        var tokens = this.tokens;
        if (id && this.token.id !== id) {
            this.error(this.token, "Se esperaba '" + id + "' pero se encontró " + token.value);
        }
        if (!tokens.hasNext()) {
            this.token = symbolTable["(end)"];
            return this.token;
        }
        t = tokens.next();
        v = t.value;
        a = t.type;
        if (a === "name") {
            o = this.scope.find(v);
        } else if (a === "operator") {
            o = symbolTable[v];
            if (!o) {
                this.error(t, "Unknown operator.");
            }
        } else if (a === "number") {
            o = symbolTable["(literal)"];
            a = "literal";
            v = parseInt(v, 10);
        } else {
            this.error(t, "Unexpected token.");
        }

        var token = Object.create(o);
        token.from = t.from;
        token.row = t.row;
        token.to = t.to;
        token.value = v;
        token.arity = a;
        this.token = token;
        return token;
    };

    this.block = function () {
        var t = this.token;
        this.advance("{");
        return t.std();
    };

    this.statement = function () {
        var n = this.token;
        var v;

        if (n.std) {
            this.advance();
            self.scope.reserve(n);
            return n.std();
        }
        v = this.expression(0);
        if (!v.assignment && v.id !== "(" && v.arity !== "routine") {
            this.error(v, "Bad expression statement.");
        }
        return v;
    };

    this.statements = function () {
        var statementsList = [];
        var symbol;
        for (; ;) {
            if (this.token.id === "}" || this.token.id === "(end)") {
                break;
            }
            var from = this.token.from;
            symbol = this.statement();
            if (symbol) {
                symbol.from = from;
                if (this.token.from) {
                    symbol.to = this.token.from;
                }
                statementsList.push(symbol);
            }
        }
        if (statementsList.length === 0) {
            return null;
        }
        return statementsList;
    };

    this.parse = function (input) {
        this.tokens.input(input);
        this.newScope();
        this.advance();
        var s = this.statements();
        this.advance("(end)");
        this.scope.pop();
        return s;
    };

    this.parseExpression = function (input) {
        this.tokens.input(input);
        this.newScope();
        this.advance();
        var s = this.expression(0);
        this.advance("(end)");
        this.scope.pop();
        return s;
    };
}
