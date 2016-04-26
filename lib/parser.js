
function ParseException(cause) {
    this.cause = cause;
}

function Parser(lexer) {
    var scope;
    var token = null;
    var tokens = lexer || new Lexer();
    var token_nr = 0;
    var self = this;

    var symbolTable = {};

    var OriginalSymbol = {
        nud: function () {
            error(this,"Undefined.");
        },
        led: function (left) {
            error(this,"Missing operator.");
        }
    };

    this.scope = function(){return scope};
    this.token = function(){return token};

    var itself = function () {
        return this;
    };

    this.error = function(token, description){
        var someError = {"error":description, "on":token};
        console.log("ERROR: ", someError);
        throw someError;
    };var error = this.error;

    var originalScope = {
        define: function (n) {
            var t = this.def[n.value];
            if (typeof t === "object") {
                n.error(t.reserved ? "Already reserved." : "Already defined.");
            }
            this.def[n.value] = n;
            n.reserved = false;
            n.nud      = itself;
            n.led      = null;
            n.std      = null;
            n.lbp      = 0;
            n.scope    = scope;
            return n;
        },
        find: function (n) {
            var e = this, o;
            while (true) {
                o = e.def[n];
                if (o && typeof o !== 'function') {
                    return e.def[n];
                }
                e = e.parent;
                if (!e) {
                    o = symbolTable[n];
                    return o && typeof o !== 'function' ? o : symbolTable["(name)"];
                }
            }
        },
        pop: function () {
            scope = this.parent;
        },
        reserve: function (n) {
            if (n.arity !== "name" || n.reserved) {
                return;
            }
            var t = this.def[n.value];
            if (t) {
                if (t.reserved) {
                    return;
                }
                if (t.arity === "name") {
                    n.error("Already defined.");
                }
            }
            this.def[n.value] = n;
            n.reserved = true;
        }
    };

    this.newScope = function () {
        var s = scope;
        scope = Object.create(originalScope);
        scope.def = {};
        scope.parent = s;
        return scope;
    };var newScope=this.newScope;


    this.symbol = function (id, bp) {
        var s = symbolTable[id];
        bp = bp || 0;
        if (s) {
            if (bp >= s.lbp) {
                s.lbp = bp;
            }
        } else {
            s = Object.create(OriginalSymbol);
            s.id = s.value = id;
            s.lbp = bp;
            symbolTable[id] = s;
        }
        return s;
    };

    this.constant = function (s, v) {
        var x = this.symbol(s);
        x.nud = function () {
            scope.reserve(this);
            this.value = symbolTable[this.id].value;
            this.arity = "literal";
            return this;
        };
        x.value = v;
        return x;
    };

    this.infix = function (id, bp, led) {
        var s = this.symbol(id, bp);
        s.led = led || function (left) {
                this.left = left;
                this.right = expression(bp);
                this.arity = "binary";
                return this;
            };
        return s;
    };

    this.infixr = function (id, bp, led) {
        var s = this.symbol(id, bp);
        s.led = led || function (left) {
                this.left = left;
                this.right = expression(bp - 1);
                this.arity = "binary";
                return this;
            };
        return s;
    };


    this.prefix = function (id, nud) {
        var s = this.symbol(id);
        s.nud = nud || function () {
                //scope.reserve(this);
                this.left = expression(70);
                this.arity = "unary";
                return this;
            };
        return s;
    };

    this.stmt = function (s, f) {
        var x = this.symbol(s);
        x.std = f;
        return x;
    };

    /**
     * The advance function fetches the next token,
     * generating the corresponding symbol from the definitions on symbolTable
     *
     *
     * @param id. Token ID
     * @returns Token
     */
    this.advance = function (id) {
        var a, o, t, v;
        if (id && token.id !== id) {
            error(token, "Expected '" + id + "'.");
        }
        if (!tokens.hasNext()) {
            token = symbolTable["(end)"];
            return token;
        }
        t = tokens.next();
        v = t.value;
        a = t.type;
        if (a === "name") {
            o = scope.find(v);
            o.nud = itself;
        } else if (a === "operator") {
            o = symbolTable[v];
            if (!o) {
                error(t,"Unknown operator.");
            }
        } else if (a ===  "number") {
            o = symbolTable["(literal)"];
            a = "literal";
        } else {
            error(t,"Unexpected token.");
        }

        token = Object.create(o);
        token.from  = t.from;
        token.to    = t.to;
        token.value = v;
        token.arity = a;
        return token;
    };var advance = this.advance;

    this.block = function () {
        var t = token;
        advance("{");
        return t.std();
    };var block = this.block;

    this.expression = function (rbp) {
        var left;
        var t = token;
        advance();
        left = t.nud();
        while (rbp < token.lbp) {
            t = token;
            advance();
            left = t.led(left);
        }
        return left;
    };var expression = this.expression;

    this.statement = function () {
        var n = token, v;

        if (n.std) {
            advance();
            scope.reserve(n);
            return n.std();
        }
        v = expression(0);
        if (!v.assignment && v.id !== "(") {
            error(v,"Bad expression statement.");
        }
        return v;
    }; var statement = this.statement;

    this.assignment = function (id) {
        return self.infixr(id, 10, function (left) {
            if (left.id !== "." && left.id !== "[" && left.arity !== "name") {
                error(left,"Bad lvalue.");
            }
            this.left = left;
            this.right = expression(9);
            this.assignment = true;
            this.arity = "binary";
            this.std = itself;
            return this;
        });
    };

    this.parse = function(input){
        tokens.input(input);
        newScope();
        advance();
        var s = statements();
        advance("(end)");
        scope.pop();
        return s;
    };

    this.statements = function () {
        var a = [], s;
        while (true) {
            if (token.id === "}" || token.id === "(end)") {
                break;
            }
            s = statement();
            if (s) {
                a.push(s);
            }
        }
        return a.length === 0 ? null : a.length === 1 ? a[0] : a;
    };var statements=this.statements;
}

module.exports = Parser;
