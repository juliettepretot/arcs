/**
 * @license
 * Copyright (c) 2019 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {Arc} from '../runtime/arc.js';
import {ArcDevtoolsChannel} from './abstract-devtools-channel.js';

export class ArcReplayManager {
  private arc: Arc;
  
  constructor(arc: Arc, arcDevtoolsChannel: ArcDevtoolsChannel) {
    this.arc = arc;
    arcDevtoolsChannel.listen('arc-replay', () => this.setup());
  }

  private setup() {
    console.log('Replay invoked for', this.arc.id);
  }
}
