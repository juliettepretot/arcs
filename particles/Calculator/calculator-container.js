defineParticle(({DomParticle, html}) => {
  return class extends DomParticle {
    get template() {
      return html`
        <span slotid="lhsTerm"></span><span slotid="operatorSlot"></span><span slotid="rhsTerm"></span>
        <span slotid="resultSlot"></span>
      `;
    }
  };
});