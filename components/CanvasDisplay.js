class CanvasDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        /* Add all the canvas display specific styles from style.css here */
        .canvas-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .canvas-wrapper {
          background-color: var(--color-surface);
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: var(--shadow-2);
          display: flex;
          flex-direction: column;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 0.5rem;
          margin-top: 0;
        }

        canvas {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          width: 100%;
          height: auto;
          aspect-ratio: 210 / 297; /* A4 Ratio */
          object-fit: contain;
          background-color: white; /* Ensure canvas background is white */
        }
      </style>
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <h2>Original</h2>
          <canvas id="originalCanvas"></canvas>
        </div>
        <div class="canvas-wrapper">
          <h2>Coloring Page</h2>
          <canvas id="coloringCanvas"></canvas>
        </div>
      </div>
    `;
  }
}

customElements.define('canvas-display', CanvasDisplay);
