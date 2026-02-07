class ControlPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        /* Add all the control panel specific styles from style.css here */
        .controls {
          background: var(--color-surface);
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: var(--shadow-2);
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: center;
          justify-content: space-between;
        }

        .control-group {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }

        .control-group.sliders {
          flex-grow: 1;
          min-width: 250px;
        }

        label {
          font-weight: 500;
        }

        input[type="file"] {
          display: none; /* Hide default input */
        }

        .button-like, button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background-color: var(--color-primary);
          color: white;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: background-color 0.2s, box-shadow 0.2s, transform 0.1s;
          box-shadow: var(--shadow-1);
        }

        .button-like:hover, button:hover:not(:disabled) {
          background-color: var(--color-primary-hover);
          box-shadow: var(--shadow-2);
          transform: translateY(-1px);
        }

        button:disabled {
          background-color: var(--color-border);
          color: var(--color-text);
          opacity: 0.6;
          cursor: not-allowed;
        }

        input[type="text"] {
          padding: 10px;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          font-size: 1rem;
          min-width: 200px;
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 10px;
          background: var(--color-border);
          border-radius: 5px;
          outline: none;
          opacity: 0.9;
          transition: opacity .2s;
        }

        input[type="range"]:hover {
          opacity: 1;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: var(--color-primary);
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid var(--color-surface);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: var(--color-primary);
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid var(--color-surface);
        }
      </style>
      <div class="controls">
        <div class="control-group">
          <label for="imageUpload" class="button-like">Upload Image</label>
          <input type="file" id="imageUpload" accept="image/*">
          <input type="text" id="imageUrl" placeholder="Or paste image URL...">
          <button id="loadUrlBtn">Load</button>
        </div>
        <div class="control-group sliders">
          <label for="blurSlider">Blur Radius: <span id="blurValue">1.0</span></label>
          <input type="range" id="blurSlider" min="0" max="5" value="1" step="0.1">
          <label for="thresholdSlider">Edge Threshold: <span id="thresholdValue">100</span></label>
          <input type="range" id="thresholdSlider" min="0" max="255" value="100">
        </div>
        <div class="control-group actions">
          <button id="convertBtn" disabled>Generate Coloring Page</button>
          <button id="downloadSvgBtn" disabled>Download SVG</button>
          <button id="printBtn" disabled>Print</button>
        </div>
      </div>
    `;
  }
}

customElements.define('control-panel', ControlPanel);
