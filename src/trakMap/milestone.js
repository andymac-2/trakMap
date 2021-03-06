"use strict";
// The milestone has some similarities to the interface of product,
// since it can behave as a dependent or dependency
/**
 * @constructor
 * @struct
 */
var Milestone = function (trakMap, index, obj) {
    /** @type {Array<Dependency>} */ this.incoming = [];
    /** @type {Array<Dependency>} */ this.outgoing = [];

    /** @type {PriorityGroup} */ this.priorityGroup;
    /** @type {number} */ this.value;
    /** @type {number} */ this.level;

    /** @type {TrakMap} */ this.trakMap = trakMap;
    /** @type {number} */ this.index = index;

    /** @type {number} */ this.direction = Product.GOINGUP;
    /** @type {Object<string, number>} */ this.position = { x: 0, y: 0 };

    this.restore(obj);
};
Milestone.DEFAULTMILESTONE = {
    "priorityGroup": 0,
    "value": Util.getDefaultDay(),
    "level": 0
};

// save and restore
Milestone.prototype.restore = function (obj) {
    this.value = obj["value"] | 0;
    this.level = obj["level"] | 0;

    this.priorityGroup = this.trakMap.priorityGroups[obj["priorityGroup"]];
    if (!this.priorityGroup) {
        throw new FileValidationError("Milestone has invalid product group index");
    }
    this.priorityGroup.addMilestone(this);
};
Milestone.prototype.save = function () {
    assert(() => this.trakMap.priorityGroups[this.priorityGroup.index] ===
        this.priorityGroup);
    return {
        "level": this.level,
        "value": this.value,
        "priorityGroup": this.priorityGroup.index
    };
};
Milestone.prototype.toJSON = Milestone.prototype.save;

//drawing
Milestone.DIAMONDSIZE = 21;
Milestone.prototype.draw = function (parent) {
    let milestone = Draw.svgElem("g", {
        "class": "milestone",
        "transform": "translate(" + this.position.x + ", " + this.position.y + ")"
    }, parent);

    milestone.addEventListener("click", () => {
        this.trakMap.select(TrakMap.SELNORMAL, this);
    });

    Draw.svgElem("path", {
        "d": "M -" + Milestone.DIAMONDSIZE + " 0" +
            "L 0 " + Milestone.DIAMONDSIZE +
            "L " + Milestone.DIAMONDSIZE + " 0" +
            "L 0 -" + Milestone.DIAMONDSIZE + " Z"
    }, milestone);

    this.drawDate(milestone, "milestoneDate");

    // TODO make this work for lazy mode
    if (this.trakMap.mode === TrakMap.GREEDYMODE) {
        Draw.menu(Draw.ALIGNCENTER, this.trakMap.unclicker, [{
            "icon": "icons/arrow-right.svg",
            "action": () => this.createProductForward()
        }, {
            "icon": "icons/delete.svg",
            "action": () => this.trakMap.deleteMilestone(this),
        }], {
                "transform": "translate(0, -40)"
            }, milestone);
    }
    else if (this.trakMap.mode === TrakMap.LAZYMODE) {
        Draw.menu(Draw.ALIGNCENTER, this.trakMap.unclicker, [{
            "icon": "icons/arrow-left.svg",
            "action": () => this.createProductBackward()
        }, {
            "icon": "icons/delete.svg",
            "action": () => this.trakMap.deleteMilestone(this),
        }], {
                "transform": "translate(0, -40)"
            }, milestone);
    }

    new Draw.svgDateInput({
        alignment: Draw.ALIGNCENTER,
        unclicker: this.trakMap.unclicker,
        onchange: (e, elem) => this.setDate(elem.date),
        parent: milestone,
        attrs: {
            "transform": "translate(0, 3)"
        }
    }, this.getValue());

    Draw.menu(Draw.ALIGNCENTER, this.trakMap.unclicker, [{
        "icon": "icons/move-up.svg",
        "action": () => this.moveUp()
    }, {
        "icon": "icons/move-down.svg",
        "action": () => this.moveDown(),
    }], {
            "transform": "translate(0, 40)"
        }, milestone);
};

Milestone.prototype.drawDate = DateBubble.prototype.drawDate;

// queries. A lot of these are similar to the Product class.
Milestone.prototype.getDate = DateBubble.prototype.getDate;
Milestone.prototype.getValue = function () {
    return this.value
};
Milestone.prototype.getEndValue = function () {
    return this.value;
};
Milestone.prototype.getStartValue = function () {
    return this.value;
};
Milestone.prototype.getStart = function () {
    return this.position;
};
Milestone.prototype.getEnd = function () {
    return this.position;
};
Milestone.prototype.getWidth = function () {
    return 0;
};
Milestone.prototype.getMinEndX = function () {
    return this.position.x;
};
Milestone.prototype.hasValidDependencies = function () {
    return false;
};
Milestone.prototype.fulfilledDependencies = function () {
    return false;
};
Milestone.prototype.getPriority = function () {
    return this.priorityGroup.priority;
};

// modifications 
// When modifying these functions, or adding another function from
// the Product prototype, make sure that the "this" types have been annotated
// correctly in Products.js
Milestone.prototype.removeDependent = Product.prototype.removeDependent;
Milestone.prototype.removeDependency = Product.prototype.removeDependency;
Milestone.prototype.addDependent = Product.prototype.addDependent;
Milestone.prototype.addDependency = Product.prototype.addDependency;
Milestone.prototype.setDirection = Product.prototype.setDirection;
Milestone.prototype.moveUp = Product.prototype.moveUp;
Milestone.prototype.moveDown = Product.prototype.moveDown;
Milestone.prototype.resolveYCoord = function () {
    let offset = this.priorityGroup.yOffset;
    let value = this.level * TrakMap.VSPACE;
    this.position.y = value + offset;
};
Milestone.prototype.setStartX = function (x) {
    this.position.x = x;
};
Milestone.prototype.setEndX = Milestone.prototype.setStartX;
Milestone.prototype.deleteThis = function () {
    assert(() => this.trakMap.milestones.indexOf(this) === -1);

    this.incoming.slice().forEach(
        dep => this.trakMap.deleteDependencyUnsafe(dep));
    this.outgoing.slice().forEach(
        dep => this.trakMap.deleteDependencyUnsafe(dep));

    assert(() => this.incoming.length === 0);
    assert(() => this.outgoing.length === 0);

    this.priorityGroup.removeMilestone(this);
};

// user events
// TODO: change date/time function
Milestone.prototype.setDate = function (date) {
    this.value = date;
    this.trakMap.draw();
};

Milestone.prototype.createProduct = function () {
    return this.trakMap.addProduct({
        "name": Product.DEFAULTNAME,
        "comment": Product.DEFAULTCOMMENT,
        "weight": Product.DEFAULTWEIGHT,
        "priorityGroup": this.priorityGroup.index,
        "level": this.level
    });
};
Milestone.prototype.createProductForward = function () {
    let product = this.createProduct();
    this.trakMap.newDependency(this, product);
    this.trakMap.draw();
};
Milestone.prototype.createProductBackward = function () {
    let product = this.createProduct();
    this.trakMap.newDependency(product, this);
    this.trakMap.draw();
};

// testing
Milestone.prototype.checkInvariants = function () {
    assert(() => this.outgoing.every(
        dep => dep.dependencyType === Dependency.MILESTONE &&
            dep.dependency === this));
    assert(() => this.incoming.every(
        dep => dep.dependentType === Dependency.MILESTONE &&
            dep.dependent === this));

    assert(() => this.trakMap.priorityGroups[this.priorityGroup.index] ===
        this.priorityGroup);
    assert(() => this.direction === Product.GOINGDOWN ||
        this.direction === Product.GOINGUP)
    assert(this.trakMap.milestones[this.index] === this)
};