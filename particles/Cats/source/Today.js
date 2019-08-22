/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

defineParticle(({DomParticle, html, resolver}) => {
    return class extends DomParticle {

        update(props, state) {
            const today = this.handles.get('today');
            today.set(new today.entityClass({day: new Date().getDate()}));
        }

    };
});