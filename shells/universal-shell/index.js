/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {connectToPlatform, waitForRenderSurface, addToast} from './lib/platform.js';

const Application = {
  ready() {
    // testing ingestion
    this.send({message: 'ingest', entity: {type: 'person', jsonData: `{"name": "John Hancock"}`}});
    setTimeout(() => {
      this.ingestTid = this.send({message: 'spawn', recipe: 'PersonAutofill'});
    }, 300);
    // upon ready, we right away ask for some Arcs
    this.arcTid = this.send({message: 'spawn', recipe: 'Notification'});
    this.catsTid = this.send({message: 'spawn', recipe: 'CatOfTheDay'});
  },
  // handle packets that were not otherwised consumed
  receive(packet) {
    // TODO(sjmiles): UiParticles that do not implement `render` return no content(?)
    if (packet.content) {
      // if we get a slot-render request for 'notification' modality, make a toast for it
      if (packet.content.model.modality === 'notification') {
        addToast(packet);
      }
    }
  },
  // platform calls here if toast is clicked
  async notificationClick(toast) {
    // if we haven't already created a Restaurants Arc...
    if (toast.msg.includes('dinner')) {
      if (!this.restaurantsTid) {
        // spin up a render surface (like a WebView)
        await waitForRenderSurface();
        // spawn 'Restaurants' arc
        const tid = Application.send({message: 'spawn', recipe: 'Restaurants'});
        // add 'Reservations' recipes
        Application.send({tid, message: 'recipe', recipe: 'MakeReservations'});
        // remember the arc's transaction identifier
        this.restaurantsTid = tid;
      }
    }
    else {
      console.log('processing notification event for', toast);
      const pid = toast.packet.content.particle.id;
      const {onclick, text} = toast.packet.content.model;
      const eventlet = {handler: onclick, data: {value: text}};
      Application.send({message: 'event', tid: this.catsTid, pid, eventlet});
    }
  }
};

connectToPlatform(Application);
