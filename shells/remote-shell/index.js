/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 *
 * This module represents the Main Process that sends commands to Arcs Runtime. The Runtime itself
 * does not act until commanded.
 *
 * We communicate with the Arcs Runtime via the pipe-shell bus, a simple message channel.
 *
 * One half of the bus is implemented by the DeviceClient object in the Arcs Runtime process. It is
 * responsible for handling messages coming out of Arcs Runtime.
 *
 * This module injects a implementation of DeviceClient into the Arcs Runtime process (this is analagous to
 * how Java currently communicates with Arcs Runtime). Note that the data packets are serialized, so we could
 * implement communication over any serial transmission channel [e.g. http].
 *
 * The pipes-shell bus uses JSON envelopes that contain, at least, a 'messageType' field which indentifies the
 * type of message being sent. The DeviceClient implementation below responds to two messageTypes:
 *
 * 1. `ready`: this message tells us that the pipes-shell is ready to receive commands (at this point our
 *    implementation binds itself to the ShellApi object, which is the command receiver).
 * 2. `slot`: this message is a request to render a slot. Modality and content information is encoded in
 *    various message fields.
 *
 * In the demo, after receiving `ready`, we command the Arcs runtime to spin up an Arc and immediately
 * instantiate a recipe, like so:
 *
 *  arcTid = send({message: 'spawn', modality: 'bus', recipe});
 *
 * The returned transaction id, `arcTid`, is used in the future to identify communications related
 * to this arc. For example, `slot` messages include a `tid` field which identifies the Arc from which
 * they arose.
 *
 * `slot` message received from runtime are processed by a UiBroker. Below, the `uiBroker` object is
 * a simple mediator between a the rendering surface and the message bus. Here, our rendering surface
 * is the iframe with id `surface`, which owns a render api which turns slot render packets into
 * actual DOM. `uiBroker` forwards rendering data to the render API on the surface, and creates an event
 * sink that propagates ui event data from the surface back to the slot-owning Particle.
 *
 */

const recipe = 'Restaurants';

let send; // function to send messages over the bus, it's late-bound (when the client declares readiness)
let arcTid; // transaction-id that identifies our arc

// element references globalized via id
const {arcs, surface} = window;

// implements the DeviceClient side of the PipeShell bus, the bit which recieves messages
// from the Arc Runtime
arcs.contentWindow.DeviceClient = {
  receive(json) {
    const packet = JSON.parse(json);
    console.log('RECEIVED: ', packet);
    // sent when pipes-shell is ready to communicate
    if (packet.message === 'ready') {
      // create function which sends to Arcs runtime
      send = msg => arcs.contentWindow.ShellApi.receive(msg);
      // bootstrap: spawn an arc using [recipe]
      arcTid = send({message: 'spawn', modality: 'bus', recipe});
    }
    // hand all slot rendering requests to a uiBroker (we could differentiate
    // by modality here, or let uiBroker do it; these decisions can be composed)
    if (packet.message === 'slot') {
      uiBroker.render(packet.content);
    }
  }
};

// uiBroker communicates with the ui surface
// - sends render packets
// - receives event packets
const uiBroker = {
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
