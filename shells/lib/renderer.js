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
import {logsFactory, logFactory} from '../../build/runtime/log-factory.js';
import IconStyles from '../../modalities/dom/components/icons.css.js';

const {log, warn} = logsFactory('Renderer', 'tomato');
const groupCollapsed = logFactory('Renderer', 'tomato', 'groupCollapsed');

const slotId = id => `[slotid="${queryId(id)}"]`;
const queryId = id => `${id.replace(/[:!]/g, '_')}`;

export const attachRenderer = (composer, containers) => {
  //warn('attached renderer to a composer');
  composer.slotObserver = {
    observe: output => observeParticleOutput(composer, output),
    dispose: () => disposeParticleOutput(composer)
  };
};

export const observeParticleOutput = (composer, output) => {
  //log('observed slot', output);
  slotChange(composer, output);
};

const disposeParticleOutput = composer => {
  if (composer && composer.root) {
    composer.root.querySelectorAll(':host > [slotid]').forEach(n => n.innerText = '');
  }
};

let pendingSlots = [];

const slotChange = async (composer, slot) => {
  if (slot) {
    //log(`changed`, slot.id, slot.rawData.id);
    pendingSlots.unshift(slot);
    processSlots(composer);
  }
};

const processSlots = async composer => {
  if (!processSlots.working) {
    processSlots.working = true;
    try {
      let slots = [];
      while (pendingSlots.length) {
        // combine left-over slots with slots that came in while awaiting
        slots = slots.concat(pendingSlots);
        // make way for new slots
        pendingSlots = [];
        //log('processing slots...', slots.length);
        // try to render each slot
        await render(composer, slots);
      }
      // return left-over slots to pending
      pendingSlots = slots;
    } finally {
      processSlots.working = false;
      if (pendingSlots.length) {
        log('done processing slots, left over slots:', pendingSlots.length);
      }
    }
  }
};

const render = async (composer, slots) => {
  for (let i=0, slot; (slot=slots[i]); i++) {
    if (renderSlot(composer, slot)) {
      slots.splice(i--, 1);
    }
  }
};

const renderSlot = async (composer, slot) => {
  let success;
  if (isEmptySlot(slot)) {
    // empty, just pretend it rendered
    success = true;
  } else if (slot.model && slot.model.json) {
    success = await renderDataSlot(composer, slot);
  } else {
    success = await renderXenSlot(composer, slot);
  }
  //log(`[${slot.particle.spec.name}]: ${success ? `rendered` : `FAILED render`}`);
  if (!success) {
    groupCollapsed(`[${slot.particle.name}]: FAILED render`);
    log(slot);
    console.groupEnd();
  } else {
    log(`[${slot.particle.name}]: rendered`);
  }
  return success;
};

const isEmptySlot = slot =>
  (!slot.template || slot.template === '') && (!slot.model || !Object.keys(slot.model).length);

const renderDataSlot = async (composer, slot) => {
  const data = document.querySelector(slotId('droot'));
  if (data) {
    data.innerHTML += `<pre style="white-space: pre-wrap;">${slot.model.json}</pre>`;
  }
  // groupCollapsed('got output data');
  // log(slot.model.json);
  // console.groupEnd();
  return true;
};

const renderXenSlot = async (composer, output) => {
  const {outputSlotId, containerSlotName, containerSlotId, slotMap, model} = output;
  const root = (composer && composer.root) || document.body;
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
        node = stampDom(composer, output, slotNode, domOutputSlotId);
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
};

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

let commonStyleTemplate;

const stampDom = (composer, output, slotNode, slotId) => {
  const {template, particle: {spec: {name}}, slotMap} = output;
  // create container node
  const container = slotNode.appendChild(document.createElement('div'));
  container.id = slotId;
  // just for humans
  container.setAttribute('particle', name);
  // events
  const controller = {
    defaultHandler: (handler, e) => {
      const {key, value} = e.currentTarget;
      const eventlet = {handler, data: {key, value}};
      log(`[${name}] is target for event`, eventlet);
      if (composer && composer.arc) {
        composer.arc.pec.sendEvent(output.particle, /*slotName*/'', eventlet);
      } else {
        warn('... failed', !!composer, composer && !!composer.arc);
      }
    }
  };
  // establish shadow root
  const root = container.attachShadow({mode: `open`});
  // provision boilerplate stylesheet
  if (!commonStyleTemplate) {
    commonStyleTemplate = Xen.Template.createTemplate(`<style>${IconStyles}</style>`);
  }
  Xen.Template.stamp(commonStyleTemplate).appendTo(root);
  // custom annotator for converting local slotids to global
  const opts = {annotator: (node, key, notes) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const localId = node.getAttribute('slotid');
      if (localId) {
        takeNote(notes, key, 'mustaches', 'slotid$', `${localId}_slot`);
        log('annotating slot: ', node.localName, localId);
        return true;
      }
    }
    return false;
  }};
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

const takeNote = function(notes, key, group, name, note) {
  const n$ = notes[key] || (notes[key] = Object.create(null));
  (n$[group] || (n$[group] = {}))[name] = note;
};
