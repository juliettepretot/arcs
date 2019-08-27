/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
defineParticle(({DomParticle, html}) => {
  return class extends DomParticle {
    get template() {
      return html`
        <select id="operation" on-change="onChange" selectedIndex="{{selectedIndex:modelIndex}}">
          <option value="add">+</option>
          <option value="divide">-</option>
          <option value="multiply">*</option>
          <option value="subtract">/</option>
        </select>
      `;
    }

    setHandles(handles) {
      this.operatorHandle = handles.get('operator');
    }

    render({operator}) {
      let modelIndex = 0;
      if (operator && operator.operator) {
        switch (operator.operator) {
          case 'add':
            modelIndex = 0; break;
          case 'divide':
            modelIndex = 1; break;
          case 'multiply':
            modelIndex = 2; break;
          case 'subtract':
            modelIndex = 3; break;
        }
      }
      return {
        modelIndex: modelIndex
      };
    }

    onChange(e) {
      this.operatorHandle.set(new this.operatorHandle.entityClass({operator: e.data.value}))
    }
  };
});