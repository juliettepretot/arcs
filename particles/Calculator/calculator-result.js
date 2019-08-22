defineParticle(({DomParticle, html}) => {
  return class extends DomParticle {
    get template() {
      return html`<div>{{result}}</div>`;
    }

    setHandles(handles) {
      this.lhsHandle = handles.get('lhs');
      this.rhsHandle = handles.get('rhs');
      this.operatorHandle = handles.get('operator');
      this.resultHandle = handles.get('result');

      this.lhs = null;
      this.rhs = null;
      this.operator = "add";
    }

    shouldRender(props) {
      return Boolean(props.result)
    }

    update({lhs, rhs, operator, result}, state) {
      if (!!lhs && !!rhs) {
        const operatorVal = (operator && operator.operator) || 'add';
        this.processAnswer(lhs, operatorVal, rhs, state.lastResult);
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
          if (rhs.value == 0) {
            throw Error("You divided by zero, dummy.")
          }
          resultValue = lhs.value / rhs.value;
          break;
      }

      if (lastResult !== resultValue) {
        this.resultHandle.set(new this.resultHandle.entityClass({value: resultValue}));
        this.setState({lastResult: resultValue});
      }
    }

    render({lhs, rhs, operator, result}) {
      return {
        result: result.value
      };
    }
  };
});