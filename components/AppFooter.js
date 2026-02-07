class AppFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        footer {
          text-align: center;
          padding-top: 1rem;
          font-size: 0.9rem;
          color: oklch(60% 0.01 240);
        }
      </style>
      <footer>
        <p>Created with AI Assistance</p>
      </footer>
    `;
  }
}

customElements.define('app-footer', AppFooter);
