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

        async update({today, allCats}) {
            if (today) {
                const cat = this.handles.get('cat');
                cat.set(new cat.entityClass(allCats[Math.floor(Math.random()*31)]));
                console.log(cat);
            }
        }
    };
});