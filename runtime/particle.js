/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
"use strict";

var runtime = require("./runtime.js");
var ParticleSpec = require("./particle-spec.js");
var tracing = require('tracelib');
var assert = require('assert');
const Schema = require('./schema.js');

const DEBUGGING = false;

class Particle {
  constructor() {
    this.spec = this.constructor.spec;
    if (this.spec.inputs.length == 0)
      this.extraData = true;
    this.relevances = [];
    this._idle = Promise.resolve();
    this._idleResolver = null;
    this._busy = 0;
    this.slotHandlers = [];
    this.stateHandlers = new Map();
    this.states = new Map();
    this._slotByName = new Map();
  }

  // Override this to do stuff
  setViews(views) {

  }

  get busy() {
    return this._busy > 0;
  }

  get idle() {
    return this._idle;
  }

  setBusy() {
    if (this._busy == 0)
    this._idle = new Promise((resolve, reject) => {
      this._idleResolver = resolve;
    });
    this._busy++;
  }

  setIdle() {
    assert(this._busy > 0);
    this._busy--;
    if (this._busy == 0)
      this._idleResolver();
  }

  set relevance(r) {
    this.relevances.push(r);
  }

  // Override this to do stuff
  dataUpdated() {
  }

  inputs() {
    return this.spec.inputs;
  }

  outputs() {
    return this.spec.outputs;
  }

  getSlot(name) {
    return this._slotByName.get(name);
  }

  addSlotHandler(f) {
    this.slotHandlers.push(f);
  }

  addStateHandler(states, f) {
    states.forEach(state => {
      if (!this.stateHandlers.has(state)) {
        this.stateHandlers.set(state, []);
      }
      this.stateHandlers.get(state).push(f);
    });
  }

  emit(state, value) {
    this.states.set(state, value);
    this.stateHandlers.get(state).forEach(f => f(value));
  }

  on(views, names, action, f) {
    if (typeof names == "string")
      names = [names];
    var trace = tracing.start({cat: 'particle', names: this.constructor.name + "::on", args: {view: names, event: action}});
    names.forEach(name => views.get(name).on(action, tracing.wrap({cat: 'particle', name: this.constructor.name, args: {view: name, event: action}}, f), this));
    trace.end();
  }

  logDebug(tag, view) {
    if (!DEBUGGING)
      return;
    let direction = this.spec.connectionMap.get(tag).direction;
    view.debugString().then(v => console.log(
       `(${this.spec.name})(${direction})(${tag}): (${view.name})`, v));
  }

  when(changes, f) {
    changes.forEach(change => change.register(this, f));
  }

  fireEvent(slotName, event) {
    // TODO(sjmiles): tests can get here without a `this.slot`, maybe this needs to be fixed in MockSlotManager?
    let slot = this.getSlot(slotName);
    assert(slot, `Particle::fireEvent: slot ${slotName} is falsey`);
    slot.fireEvent(event);
  }
}

class ViewChanges {
  constructor(views, names, type) {
    if (typeof names == "string")
      names = [names];
    this.names = names;
    this.views = views;
    this.type = type;
  }
  register(particle, f) {
    var modelCount = 0;
    var afterAllModels = () => { if (++modelCount == this.names.length) { f(); } };

    for (var name of this.names) {
      var view = this.views.get(name);
      view.synchronize(this.type, afterAllModels, f, particle)
    }
  }
}

class SlotChanges {
  constructor() {
  }
  register(particle, f) {
    particle.addSlotHandler(f);
  }
}

class StateChanges {
  constructor(states) {
    if (typeof states == "string")
      states = [states];
    this.states = states;
  }
  register(particle, f) {
    particle.addStateHandler(this.states, f);
  }
}

exports.Particle = Particle;
exports.ViewChanges = ViewChanges;
exports.SlotChanges = SlotChanges;
exports.StateChanges = StateChanges;
