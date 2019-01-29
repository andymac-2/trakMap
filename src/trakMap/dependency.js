'use strict'
// this class does not automatically update the screen when it is constructed.

var Dependency = function (trakMap, index, obj) {
    // state
    this.dependency;
    this.dependent;

    // view model
    this.trakMap = trakMap;
    
    this.start;
    this.end;

    this.index = index;

    //view
    this.elem;

    this.restore (obj);
}

Dependency.prototype.draw = function (parent) {
    var connections = Draw.svgElem("g", {
        "class": "dependency"
    }, parent);

    connections.addEventListener("dblclick", () => this.deleteThis());

    if (this.dependency.getEndValue() === this.dependent.getStartValue() &&
        this.dependency.getPriority() <= this.dependent.getPriority()){
        var cls = "priorityLine priority-" + this.dependent.getPriority();
        this.elem = Draw.straightLine(
            this.dependent.start, this.dependency.end, cls, connections);      
    }
    else {
        this.elem = Draw.doubleAngledLine(
            this.dependent.start, this.dependency.end, TrakMap.HSPACE,
            TrakMap.VSPACE, "priorityLine slack", connections);
    }

    return connections;
};

// Serialisation methods
Dependency.prototype.restore = function (obj) {
    this.dependency = this.trakMap.products[obj.dependency];
    this.dependency.outgoing.push(this);

    this.dependent = this.trakMap.products[obj.dependent];
    this.dependent.incoming.push(this);
};
Dependency.prototype.save = function () {
    assert(() => this.trakMap.products[this.dependency.index] ===
           this.dependency);
    assert(() => this.trakMap.products[this.dependent.index] ===
           this.dependent);
    
    return {
        "dependency": this.dependency.index,
        "dependent": this.dependent.index
    };
};
Dependency.prototype.toJSON = Dependency.prototype.save;

//user events
Dependency.prototype.deleteThis  = function () {
    this.dependency.removeDependent(this);
    this.dependent.removeDependency(this);
    this.trakMap.removeDependency(this);
    this.trakMap.draw();
};
