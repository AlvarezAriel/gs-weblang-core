var Context = function () {
    var state = {};

    this.put = function (key, value) {
        state[key] = value;
    };
    this.get = function (id) {
        return state[id];
    };
    this.all = function () {
        return state;
    };
};

module.exports = Context;
