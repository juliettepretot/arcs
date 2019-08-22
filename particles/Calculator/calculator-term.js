
defineParticle(({DomParticle, html}) => {
  return class extends DomParticle {
    get template() {
      return html`<input type="number" on-keyup="changed" value$="{{value}}" />`;
    }

    setHandles(handles) {
      handles.get('term').configure({notifyDesync: true});
      this.termHandle = handles.get('term');
    }

    render({term}, state) {
      if (!term) {
        return {value: ""}
      }
      return {
        value: term.value
      };
    }

    changed(e) {
      this.termHandle.set(new this.termHandle.entityClass({value: parseFloat(e.data.value)}));
    }
  };
});