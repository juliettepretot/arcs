defineParticle(({DomParticle,html}) => {
  return class extends DomParticle {
    get template() {
      return html`
      <div>
        <input type="number" id="lhs" placeholder="Enter a number" on-keyup="onLhsChange"/>
        <select id="operation" on-change="onOperatorChange">
          <option value="add" selected>+</option>
          <option value="subtract">-</option>
          <option value="multiply">*</option>
          <option value="divide">/</option>
        </select>
        <input type="number" id="rhs" placeholder="Enter a number" on-keyup="onRhsChange"/>
      </div>
      <div>{{calculation}}</div>
      `;
    }

    render(props, state) {
      const lhs = state.lhs;
      const rhs = state.rhs;
      const operator = state.operator || "add";
      const outState = {};
      if (operator == "add") {
        outState.calculation = lhs + rhs;
      } else if (operator == "subtract") {
        outState.calculation = lhs - rhs;
      } else if (operator == "multiply") {
        outState.calculation = lhs * rhs;
      } else if (operator == "divide") {
        if (rhs === 0) {
          this.crash();
        }
        outState.calculation = lhs / rhs;
      }
      return outState;
    }

    onLhsChange(e) {
      this.setState({lhs: parseFloat(e.data.value)});
    }

    onRhsChange(e) {
      this.setState({rhs: parseFloat(e.data.value)});
    }

    onOperatorChange(e) {
      this.setState({operator: e.data.value});
    }

    crash() {
      throw new Error("UH OH!!!!!!!!!!1");
    }
  };
});