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
    // upon ready, we right away ask for an Arc
    this.arcTid = this.send({message: 'spawn', recipe: 'Notification'});
  },
  // handle packets that were not otherwised consumed
  receive(packet) {
    // if we get a slot-render request for 'notification' modality, make a toast for it
    if (packet.messageType === 'slot' && packet.modality === 'notification') {
      addToast(packet.content.model.text);
    }
  },
  // platform calls here if toast is clicked
  async notificationClick(toast) {
    // if we haven't already created a Restaurants Arc...
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
};

connectToPlatform(Application);
