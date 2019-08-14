/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

//const recipe = 'Login';
const recipe = 'Restaurants';

let send; // late-bound function to send messages over the bus
let arcTid; // transaction-id that identifies our arc

// element references globalized via id
const {arcs, surface} = window;

// implements the DeviceClient side of the PipeShell bus
arcs.contentWindow.DeviceClient = {
  receive(json) {
    const packet = JSON.parse(json);
    console.log('RECEIVED: ', packet);
    // sent when pipes-shell is ready to communicate
    if (packet.message === 'ready') {
      // sends to Arcs runtime
      send = msg => arcs.contentWindow.ShellApi.receive(msg);
      // bootstrap: spawn an arc using [recipe]
      arcTid = send({message: 'spawn', modality: 'bus', recipe});
    }
    // slot rendering request
    if (packet.message === 'slot') {
      uiClient.render(packet.content);
    }
  }
};

// uiClient communicates with the ui surface
// - sends render packets
// - receives event packets
const uiClient = {
  render(content) {
    // locate the renderer
    const {renderer} = surface.contentWindow;
    // attach an event dispatcher
    renderer.dispatch = (pid, eventlet) => {
      // `send` and `arcTid` are module variables, only one arc atm
      send({message: 'event', tid: arcTid, pid, eventlet});
    };
    // send message to renderer
    renderer.render(content);
  }
};
