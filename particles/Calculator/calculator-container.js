defineParticle(({DomParticle, html}) => {
  return class extends DomParticle {
    get template() {
      return html`
        <span slotid="lhsTerm" style="display: inline-block"></span>
        <span slotid="operatorSlot" style="display: inline-block"></span>
        <span slotid="rhsTerm" style="display: inline-block"></span>
        = <span slotid="resultSlot" style="display: inline-block"></span>
      `;
    }
  };
});