class AppHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        h1 {
          font-family: var(--font-family-serif);
          font-size: clamp(2rem, 5vw, 3.5rem);
          color: var(--color-primary);
          margin-block: 0.5em;
          text-align: center;
        }
        p {
          text-align: center;
          font-size: 1.1rem;
          color: var(--color-text);
          margin-top: -1em;
        }
      </style>
      <header>
        <h1>Coloring Book Creator</h1>
        <p>Upload an image and turn it into a beautiful, printable coloring page.</p>
      </header>
    `;
  }
}

customElements.define('app-header', AppHeader);
