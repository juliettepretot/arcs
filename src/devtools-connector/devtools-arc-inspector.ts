/**
 * @license
 * Copyright (c) 2018 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {DevtoolsChannel} from '../platform/devtools-channel-web.js';
import {Arc} from '../runtime/arc.js';
import {Runnable} from '../runtime/hot.js';
import {Manifest} from '../runtime/manifest.js';
import {Particle} from '../runtime/recipe/particle.js';
import {ArcInspector, ArcInspectorFactory} from '../runtime/arc-inspector.js';
import {mapStackTrace} from '../platform/sourcemapped-stacktrace-web.js';
import {ArcStoresFetcher} from './arc-stores-fetcher.js';
import {ArcPlannerInvoker} from './arc-planner-invoker.js';
import {DevtoolsConnection} from './devtools-connection.js';
import {enableTracingAdapter} from './tracing-adapter.js';
import {Slot} from '../runtime/recipe/slot.js';
import {HotCodeReloader} from './hot-code-reloader.js';
import {ArcReplayManager} from './arc-replay-manager.js';

type StackFrame = {method:string, location?:string, target?:string, targetClass?:string};

// Arc-independent handlers for devtools logic.
void DevtoolsConnection.onceConnected.then(devtoolsChannel => {
  enableTracingAdapter(devtoolsChannel);
});

export const devtoolsArcInspectorFactory: ArcInspectorFactory = {
  create(arc: Arc): ArcInspector {
    return new DevtoolsArcInspector(arc);
  }
};

class DevtoolsArcInspector implements ArcInspector {

  private arcDevtoolsChannel: DevtoolsChannel = null;
  private arc: Arc;

  private onceActiveResolve: Runnable|null = null;
  public onceActive: Promise<void>|null = null;
  
  constructor(arc: Arc) {
    if (arc.isStub) return;

    this.arc = arc;
    this.onceActive = new Promise(resolve => this.onceActiveResolve = resolve);

    const connectedOnInstantiate = DevtoolsConnection.isConnected;

    void DevtoolsConnection.onceConnected.then(devtoolsChannel => {
      if (!connectedOnInstantiate) {
        devtoolsChannel.send({
          messageType: 'warning',
          messageBody: 'pre-existing-arc'
        });
      }

      this.arcDevtoolsChannel = devtoolsChannel.forArc(arc);

      const unused1 = new ArcStoresFetcher(arc, this.arcDevtoolsChannel);
      const unused2 = new ArcPlannerInvoker(arc, this.arcDevtoolsChannel);
      const unused3 = new HotCodeReloader(arc, this.arcDevtoolsChannel);
      const unused4 = new ArcReplayManager(arc, this.arcDevtoolsChannel);

      this.arcDevtoolsChannel.send({
        messageType: 'arc-available',
        messageBody: {
          speculative: arc.isSpeculative,
          inner: arc.isInnerArc
        }
      });

      this.sendEnvironmentMessage(arc);
      this.onceActiveResolve();
    });
  }

  public recipeInstantiated(particles: Particle[], activeRecipe: string) {
    if (!DevtoolsConnection.isConnected) return;

    type TruncatedSlot = {id: string, name: string};
    const truncate = ({id, name}: Slot) => ({id, name});
    const slotConnections = <{particleId: string, consumed: TruncatedSlot, provided: TruncatedSlot[]}[]>[];
    particles.forEach(p => p.getSlotConnections().forEach(cs => {
      if (cs.targetSlot) {
        slotConnections.push({
          particleId: cs.particle.id.toString(),
          consumed: truncate(cs.targetSlot),
          provided: Object.values(cs.providedSlots).map(slot  => truncate(slot)),
        });
      }
    }));
    this.arcDevtoolsChannel.send({
      messageType: 'recipe-instantiated',
      messageBody: {slotConnections, activeRecipe}
    });

    if (!this.arc.isSpeculative) this.updateParticleSet(particles);
  }

  private updateParticleSet(particles: Particle[]) {
    const particleSources = [];
    particles.forEach(particle => {
      particleSources.push(particle.spec.implFile);
    });
    this.arcDevtoolsChannel.send({
      messageType: 'watch-particle-sources',
      messageBody: particleSources
    });
  }

  public pecMessage(name: string, pecMsgBody: object, pecMsgCount: number, stackString: string) {
    if (!DevtoolsConnection.isConnected) return;
    
    const stack = this._extractStackFrames(stackString);
    this.arcDevtoolsChannel.send({
      messageType: 'PecLog',
      messageBody: {name, pecMsgBody, pecMsgCount, timestamp: Date.now(), stack},
    });
  }

  _extractStackFrames(stackString: string): StackFrame[] {
    const stack: StackFrame[] = [];
    if (!stackString) return stack;

    // File refs should appear only in stack traces generated by tests run with
    // --explore set.
    if (stackString.includes('(file:///')) {
      // The slice discards the 'Error' text and the the stack frame
      // corresponding to the API channel function, which is already being
      // displayed in the log entry.
      for (const frameString of stackString.split('\n    at ').slice(2)) {
        const match = frameString.match(/^(.*) \((.*)\)$/);
        const method = match ? match[1] : '<unknown>';
        let location = match ? match[2] : frameString;
        location = location.replace(/:[0-9]+$/, '');
        if (location.startsWith('file')) {
          // 'file:///<path>/arcs.*/runtime/file.js:84'
          // -> location: 'runtime/file.js:150'
          location = location.replace(/^.*\/arcs[^/]*\//, '');
        }
        stack.push({method, location, target: null, targetClass: 'noLink'});
      }
      return stack;
    }

    // The slice discards the stack frame corresponding to the API channel
    // function, which is already being displayed in the log entry.
    if (mapStackTrace) {
      mapStackTrace(stackString, (mapped: string[]) => mapped.slice(1).map(frameString => {
        // Each frame has the form '    at function (source:line:column)'.
        // Extract the function name and source:line:column text, then set up
        // a frame object with the following fields:
        //   location: text to display as the source in devtools Arcs panel
        //   target: URL to open in devtools Sources panel
        //   targetClass: CSS class specifier to attach to the location text
        const match = frameString.match(/^ {4}at (.*) \((.*)\)$/);
        const method = match ? match[1] : '<unknown>';
        let source = match ? match[2] : frameString.replace(/^ *at */, '');
        
        const frame: StackFrame = {method};
        source = match[2].replace(/:[0-9]+$/, '');
        if (source.startsWith('http')) {
          // 'http://<url>/arcs.*/shell/file.js:150'
          // -> location: 'shell/file.js:150', target: same as source
          frame.location = source.replace(/^.*\/arcs[^/]*\//, '');
          frame.target = source;
          frame.targetClass = 'link';
        } else if (source.startsWith('webpack')) {
          // 'webpack:///runtime/sub/file.js:18'
          // -> location: 'runtime/sub/file.js:18', target: 'webpack:///./runtime/sub/file.js:18'
          frame.location = source.slice(11);
          frame.target = `webpack:///./${frame.location}`;
          frame.targetClass = 'link';
        } else {
          // '<anonymous>' (or similar)
          frame.location = source;
          frame.target = null;
          frame.targetClass = 'noLink';
        }
        stack.push(frame);
      }), {sync: false, cacheGlobally: true});
    }
    return stack;
  }

  public isActive() {
    return DevtoolsConnection.isConnected;
  }

  private sendEnvironmentMessage(arc: Arc) {
    const allManifests: Manifest[] = [];

    (function traverse(manifest: Manifest) {
      allManifests.push(manifest);
      manifest.imports.forEach(traverse);
    })(arc.context);

    this.arcDevtoolsChannel.send({
      messageType: 'arc-environment',
      messageBody: {
        recipes: arc.context.allRecipes.map(r => ({
          name: r.name,
          text: r.toString(),
          file: allManifests.find(m => m.recipes.includes(r)).fileName
        })),
        particles: arc.context.allParticles.map(p => ({
          name: p.name,
          spec: p.toString(),
          file: allManifests.find(m => m.particles.includes(p)).fileName
        }))
      }
    });
  }
}
