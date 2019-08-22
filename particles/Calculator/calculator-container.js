defineParticle(({DomParticle, html}) => {
  return class extends DomParticle {
    get template() {
      return html`
        <style>
          .calculator-body > span {
            display: inline-block;
          }
        </style>
        <div class="calculator-body">
          <span class="lhs" slotid="lhsTerm"></span>
          <span class="operator" slotid="operatorSlot"></span>
          <span class="rhs" slotid="rhsTerm"></span>
          = <span class="result" slotid="resultSlot"></span>
        </div>
      `;
    }
  };
});