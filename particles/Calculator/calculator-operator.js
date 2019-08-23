defineParticle(({DomParticle, html}) => {
  return class extends DomParticle {
    get template() {
      return html`
        <select id="operation" on-change="onChange">
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

    onChange(e) {
      this.operatorHandle.set(new this.operatorHandle.entityClass({operator: e.data.value}))
    }
  };
});