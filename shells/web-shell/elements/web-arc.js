/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../../lib/components/xen.js';
import {ArcHost} from '../../lib/components/arc-host.js';
import {RamSlotComposer} from '../../lib/components/ram-slot-composer.js';
import {attachRenderer} from '../../lib/renderer.js';

const log = Xen.logFactory('WebArc', '#cb23a6');

const template = Xen.Template.html`
<style>
  :host {
    display: block;
  }
  [slotid="modal"] {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    box-sizing: border-box;
    pointer-events: none;
  }
</style>
<div slotid="top" id="rootslotid-top"></div>
<div slotid="root" id="rootslotid-root"></div>
<div slotid="modal" id="rootslotid-modal"></div>
  `;

/*
 * TODO(sjmiles): this is messed up, fix:
 * `config.manifest` is used by Utils.spawn to bootstrap a recipe
 * `manifest` is used by WebArc to add a recipe
 */

// config = {id, [serialization], [manifest]}

export class WebArc extends Xen.Debug(Xen.Async, log) {
  static get observedAttributes() {
    return ['context', 'storage', 'composer', 'config', 'manifest', 'plan'];
  }
  get template() {
    return template;
  }
  _didMount() {
    const slots = ['top', 'root', 'modal'];
    this.containers = {};
    slots.forEach(slot => {
      this.containers[slot] = this.host.querySelector(`[slotid="${slot}"]`);
    });
  }
  update(props, state) {
    const {storage, config, manifest, plan} = props;
    if (!state.host && storage && config) {
      this.state = {host: this.createHost()};
    }
    if (state.host && config && config !== state.config) {
      this.disposeArc(state.host);
      this.state = {config, arc: null};
    }
    if (!state.arc && config && state.host) {
      this.awaitState('arc', async () => this.spawnArc(state.host, config));
    }
    // will attempt to instantiate first recipe in `manifest`
    if (state.host && state.manifest !== manifest) {
      this.state = {manifest};
      if (manifest) {
        state.host.manifest = manifest;
      }
    }
    if (plan && state.host && plan !== state.plan) {
      state.host.plan = state.plan = plan;
    }
  }
  createHost() {
    log('creating host');
    let {context, storage, composer, config} = this.props;
    composer = new RamSlotComposer({
      top: 'top',
      root: 'root',
      modal: 'modal',
    });
    composer.root = this.host;
    // attach UiBroker to composer and plumb the event channel
    attachRenderer(composer).dispatch = (pid, eventlet) => {
      log('composer dispatch for pid', pid, eventlet);
      this.firePecEvent(composer, pid, eventlet);
    };
    this.state = {composer};
    // if (config.suggestionContainer) {
    //   this.containers.suggestions = config.suggestionContainer;
    // }
    // if (!composer) {
    //   composer = new DomSlotComposer({containers: this.containers});
    // }
    return new ArcHost(context, storage, composer);
  }
  firePecEvent(composer, pid, eventlet) {
    if (composer && composer.arc) {
      const particle = composer.arc.activeRecipe.particles.find(
        particle => String(particle.id) === String(pid)
      );
      if (particle) {
        log('firing PEC event for', particle.name);
        // TODO(sjmiles): we need `arc` and `particle` here even though
        // the two are bound together, figure out how to simplify
        composer.arc.pec.sendEvent(particle, /*slotName*/'', eventlet);
      }
    }
  }
  disposeArc(host) {
    log('disposing arc');
    host.disposeArc();
    this.fire('arc', null);
  }
  async spawnArc(host, config) {
    log(`spawning arc [${config.id}]`);
    const arc = await host.spawn(config);
    log(`arc spawned [${config.id}]`);
    this.fire('arc', arc);
    return arc;
  }
}
customElements.define('web-arc', WebArc);
