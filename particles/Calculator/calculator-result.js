defineParticle(({DomParticle, html}) => {
  return class extends DomParticle {
    get template() {
      return html`<div>{{result}}</div>`;
    }

    shouldRender(props) {
      return Boolean(props.result)
    }

    render({result}) {
      return {
        result: result.value
      };
    }
  };
});