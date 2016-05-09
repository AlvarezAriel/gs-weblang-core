var Statement = {
    arity: "statement"
};

var behaviours = {
    conditional: function (condition, left, right) {
        var stmt = Object.create(Statement);
        stmt.alias = "conditional";
        stmt.condition = condition;
        stmt.left = left;
        stmt.right = right;
        stmt.interpret = function (context) {
            return condition.eval(context) ? left.interpret(context) : right.interpret(context);
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
    }
};

module.exports = behaviours;

