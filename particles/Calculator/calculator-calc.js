/**
 * @license
 * Copyright (c) 2019 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

 defineParticle(({DomParticle, http}) => {
  return class extends DomParticle {
    update({lhs, rhs, operator}, state) {
      if (!!lhs && !!rhs) {
        const operatorVal = operator.operator;
        this.processAnswer(lhs, operatorVal, rhs);
      }
    }

    processAnswer(lhs, operator, rhs, lastResult) {
      let resultValue = 0;

      switch (operator) {
        case 'add':
          resultValue = lhs.value + rhs.value;
          break;
        case 'subtract':
          resultValue = lhs.value - rhs.value;
          break;
        case 'multiply':
          resultValue = lhs.value * rhs.value;
          break;
        case 'divide':
          resultValue = lhs.value / rhs.value;
          break;
        default:
          throw Error('Invalid operator');
      }

      if (lastResult !== resultValue) {
        const handle = this.handles.get('result');
        handle.set(new handle.entityClass({value: resultValue}));
      }
    }
  };
});