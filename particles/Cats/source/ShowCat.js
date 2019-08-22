/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

 'use strict';

defineParticle(({UiParticle}) => {

    return class extends UiParticle {
        render(props, state) {
            return {
                modality: 'notification',
                text: 'Hello world!'
            };
        }
    };

});


/*defineParticle(({DomParticle, html, resolver}) => {
    return class extends DomParticle {

        get template() {
            return 'Today\'s cat is <span>{{name}}</span>!';
        }
        render({cat}) {
            if (cat) {
                return {
                    name: cat.name,
                    description: cat.description
                };
            }
        }
    };
});*/