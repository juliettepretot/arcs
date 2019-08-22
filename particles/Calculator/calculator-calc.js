defineParticle(({DomParticle, http}) => {
  return class extends DomParticle {
    update({lhs, rhs, operator}, state) {
      if (!!lhs && !!rhs) {
        const operatorVal = operator.operator;
        this.processAnswer(lhs, operatorVal, rhs);
      }
    }

    processAnswer(lhs, operator, rhs, lastResult) {
      var resultValue = 0;

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
          throw Error("Invalid operator");
          break;
      }

      if (lastResult !== resultValue) {
        const handle = this.handles.get('result');
        handle.set(new handle.entityClass({value: resultValue}));
      }
    }
  };
});