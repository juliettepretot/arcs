/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {Xen} from '../lib/components/xen.js';
import {logFactory} from '../../build/runtime/log-factory.js';
import IconStyles from '../../modalities/dom/components/icons.css.js';

const log = logFactory('Renderer', 'tomato');
//const warn = logFactory('Renderer', 'tomato', 'warn');
const groupCollapsed = logFactory('Renderer', 'tomato', 'groupCollapsed');

const slotId = id => `[slotid="${queryId(id)}"]`;
const queryId = id => `${id.replace(/[:!]/g, '_')}`;

export const SlotObserver = class {
  constructor(root) {
    this.root = root;
    this.pendingSlots = [];
  }
  disposeParticleOutput() {
    this.root.querySelectorAll(':host > [slotid]').forEach(n => n.innerText = '');
  }
  observe(slot) {
    this.render(slot);
  }
  render(slot) {
    //log(`changed`, slot.id, slot.rawData.id);
    this.pendingSlots.unshift(slot);
    this.processSlots();
  }
  async processSlots() {
    if (!this.processSlots.working) {
      this.processSlots.working = true;
      try {
        let slots = [];
        while (this.pendingSlots.length) {
          // combine left-over slots with slots that came in while awaiting
          slots = slots.concat(this.pendingSlots);
          // make way for new slots
          this.pendingSlots = [];
          //log('processing slots...', slots.length);
          // try to render each slot
          return slots.filter(slot => !this.renderSlot(slot));
        }
        // return left-over slots to pending
        this.pendingSlots = slots;
      } finally {
        this.processSlots.working = false;
        if (this.pendingSlots.length) {
          log('done processing slots, left over slots:', this.pendingSlots.length);
        }
      }
    }
  }
  async renderSlot(slot) {
    let success;
    if (isEmptySlot(slot)) {
      // empty, just pretend it rendered
      success = true;
    } else if (slot.model && slot.model.json) {
      success = await this.renderDataSlot(slot);
    } else {
      success = await this.renderXenSlot(slot);
    }
    //log(`[${slot.particle.name}]: ${success ? `rendered` : `FAILED render`}`);
    if (!success) {
      groupCollapsed(`[${slot.particle.name}]: FAILED render`);
      log(slot);
      console.groupEnd();
    } else {
      log(`[${slot.particle.name}]: rendered`);
    }
    return success;
  }
  async renderDataSlot(slot) {
    const data = document.querySelector(slotId('droot'));
    if (data) {
      data.innerHTML += `<pre style="white-space: pre-wrap;">${slot.model.json}</pre>`;
    }
    // groupCollapsed('got output data');
    // log(slot.model.json);
    // console.groupEnd();
    return true;
  }
  async renderXenSlot(output) {
    const {outputSlotId, containerSlotName, containerSlotId, slotMap, model} = output;
    const root = this.root || document.body;
    let slotNode;
    const data = model || Object;
    if (containerSlotId) {
      // TODO(sjmiles):
      // muxed slots have the format [muxerSlotId___muxedSlotId]
      const delim = `___`;
      const muxerSlotId = containerSlotId.includes(delim) && containerSlotId.split(delim)[0];
      if (muxerSlotId) {
        // we use muxerSlot and subId to locate muxed nodes
        const selector = `${slotId(muxerSlotId)}[subid="${data.subid}"]`;
        slotNode = deepQuerySelector(root, selector);
        //console.warn('muxedNode:', muxedNode);
        //log('RenderEx:found multiplexed slot for', containerSlotName, data.subid);
        if (!slotNode) {
          log(`couldn't find muxed slotNode`);
          return false;
        }
      } else {
        slotNode =
          // TODO(sjmiles): memoize containerSlotId => node mappings?
          // slotId's are unique in the tree
          deepQuerySelector(root, slotId(containerSlotId))
          // use `containerSlotName` to catch root slots (not deep!)
          || root.querySelector(slotId(containerSlotName))
          || root.querySelector(`#${queryId(containerSlotId)}`)
          ;
      }
      //log(rawData);
      if (slotNode && outputSlotId) {
        const domOutputSlotId = `${queryId(outputSlotId)}`;
        let node = slotNode.querySelector(`#${domOutputSlotId}`);
        if (node) {
          //log('RenderEx: using existing node', outputSlotId);
        } else {
          //log('RenderEx: found no node in the container, making one', outputSlotId);
          const dispatcher = (...args) => this.dispatch(...args);
          node = stampDom(output, slotNode, domOutputSlotId, dispatcher);
        }
        if (node && node.xen) {
          // TODO(sjmiles): hackity hack hack
          if (data && data.items && data.items.models) {
            const slotModel = {};
            Object.keys(slotMap).forEach(key => {
              slotModel[`${key}_slot`] = queryId(slotMap[key]);
            });
            data.items.models.forEach(model => Object.assign(model, slotModel));
          }
          node.xen.set(data);
        }
        return true;
      }
    }
  }
  dispatch(pid, eventlet) {
    log(`sending event to target [${eventlet.name}]: `, eventlet);
  }
};

export const attachRenderer = (composer, containers) => {
  return composer.slotObserver = new SlotObserver(composer.root);
};

const isEmptySlot = slot =>
  (!slot.template || slot.template === '') && (!slot.model || !Object.keys(slot.model).length);

const deepQuerySelector = (root, selector) => {
  const find = (element, selector) => {
    let result;
    while (element && !result) {
      result =
          (element.matches && element.matches(selector) ? element : null)
          || find(element.firstElementChild, selector)
          || (element.shadowRoot && find(element.shadowRoot.firstElementChild, selector))
          ;
      element = element.nextElementSibling;
    }
    return result;
  };
  return find(root || document.body, selector);
};

const stampDom = (output, slotNode, slotId, dispatch) => {
  const {template, particle: {name}, slotMap} = output;
  // create container node
  const container = slotNode.appendChild(document.createElement('div'));
  container.id = slotId;
  // just for humans
  container.setAttribute('particle', name);
  // establish shadow root
  const root = container.attachShadow({mode: `open`});
  // provision boilerplate stylesheet
  if (!stampDom.styleTemplate) {
    stampDom.styleTemplate = Xen.Template.createTemplate(`<style>${IconStyles}</style>`);
  }
  Xen.Template.stamp(stampDom.styleTemplate).appendTo(root);
  // custom annotator that takes note of `slotid` bindings so
  // we can convert slotids from local-names to global-ids
  const opts = {annotator: (node, key, notes) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const localId = node.getAttribute('slotid');
      if (localId) {
        Xen.Template.takeNote(notes, key, 'mustaches', 'slotid$', `${localId}_slot`);
        log('annotating slot: ', node.localName, localId);
        return true;
      }
    }
    return false;
  }};
  // build event controller
  const controller = {
    defaultHandler: (handler, e) => {
      const {key, value} = e.currentTarget;
      const eventlet = {name, handler, data: {key, value}};
      if (dispatch) {
        dispatch(output.particle.id, eventlet);
      }
    }
  };
  // stamp template, attach listeners, add to DOM
  container.xen = Xen.Template.stamp(template, opts).events(controller).appendTo(root);
  // install slotids
  const slotModel = {};
  Object.keys(slotMap).forEach(key => {
    slotModel[`${key}_slot`] = queryId(slotMap[key]);
  });
  container.xen.set(slotModel);
  // finished container
  return container;
};
