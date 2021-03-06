var Statement = {
    arity: "statement"
};

function interpretBlock(block, context){
    block = block || [];
    for(var i=0; i < block.length;i++){
        block[i].interpret(context);
    }
}

function fillParameters(context, parameters, declaration){
    for(var i=0; i < declaration.parameters.length;i++){
        context.put(declaration.parameters[i].value, parameters[i].eval(context));
    }
}

var behaviours = {
    conditional: function (condition, left, right) {
        var stmt = Object.create(Statement);
        stmt.alias = "conditional";
        stmt.condition = condition;
        stmt.left = left;
        stmt.right = right;
        stmt.interpret = function (context) {
            interpretBlock(condition.eval(context) ? left : right, context);
            return context;
        };
        return stmt;
    },
    literal: function () {
        return function () {
            var self = this;
            this.eval = function () {
                return self.value;
            };
            return this;
        };
    },
    variable: function () {
        return function () {
            var self = this;
            this.eval = function (context) {
                return context.get(self.value);
            };
            return this;
        };
    },
    assignment: function (left, right) {
        var stmt = Object.create(Statement);
        stmt.alias = ":=";
        stmt.arity = "binary";
        stmt.variable = left;
        stmt.expression = right;
        stmt.assignment = true;
        stmt.interpret = function (context) {
            context.put(left.value, right.eval(context));
        };
        return stmt;
    },
    procedureDeclaration: function (name, parameters, body) {
        return {
            interpret:function(context){return context;},
            name: name,
            arity: "routine",
            alias: "procedureDeclaration",
            parameters: parameters,
            body: body
        };
    },
    procedureCall: function (declaration, parameters) {
        var stmt = Object.create(Statement);
        stmt.arity = "routine";
        stmt.alias = "ProcedureCall";
        stmt.declaration = declaration;
        stmt.parameters = parameters;

        stmt.interpret = function (context) {
            context.startContext();
            fillParameters(context, parameters, declaration);
            interpretBlock(declaration.body, context);
            context.stopContext();
            return context;
        };
        return stmt;
    },
    putStone: function (expression) {
        var stmt = Object.create(Statement);
        stmt.alias = "PutStone";
        stmt.color = expression;
        stmt.interpret = function (context) {
            context.board().putStone(expression.eval(context));
            return context;
        };
        return stmt;
    },
    removeStone: function (expression) {
        var stmt = Object.create(Statement);
        stmt.alias = "RemoveStone";
        stmt.parameters = [expression];
        stmt.interpret = function (context) {
            context.board().removeStone(expression.eval(context));
            return context;
        };
        return stmt;
    },
    moveClaw: function (expression) {
        var stmt = Object.create(Statement);
        stmt.alias = "MoveClaw";
        stmt.paramters = [expression];
        stmt.interpret = function (context) {
            context.board().move(expression.eval(context));
            return context;
        };
        return stmt;
    },
    hasStone: function (expression) {
        var fun = {};
        fun.eval = function (context) {
            return context.board().hasStone(expression.eval(context));
        };
        return fun;
    },
    canMove: function (expression) {
        var fun = {};
        fun.eval = function (context) {
            return context.board().canMove(expression.eval(context));
        };
        return fun;
    }
};

module.exports = behaviours;

