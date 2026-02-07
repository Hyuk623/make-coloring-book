# Blueprint: AI-Powered Coloring Page Generator

## **Overview**

This application transforms user-uploaded images into downloadable coloring book pages. It is built using modern, framework-less web technologies, with a focus on modularity and maintainability through Web Components.

## **Architecture: Web Components**

The application's UI is broken down into encapsulated, reusable components:

-   **`<app-header>`**: Displays the main title and introductory text.
-   **`<control-panel>`**: Contains all user-facing controls, including file uploads, sliders for image processing, and action buttons. It emits custom events to communicate user actions to the main application logic.
-   **`<canvas-display>`**: Manages the rendering of the original and processed images onto their respective canvas elements.
-   **`<app-footer>`**: Displays footer content.

This component-based architecture decouples the application logic from the UI structure, making the codebase easier to manage, test, and extend.

## **Core Features & Design**

### **1. Image Processing & SVG Export**
-   **Pipeline:** A client-side JavaScript pipeline handles image processing: Grayscale -> Gaussian Blur -> Sobel Edge Detection -> Non-Maximum Suppression -> Thresholding.
-   **Vectorization:** The final raster image is converted into a crisp, scalable vector graphic (SVG) using a client-side Potrace library, which is ideal for printing.

### **2. Styling & Layout**
-   **Modern CSS:** The UI is styled with modern CSS features, including a responsive grid layout, CSS custom properties for theming, and a polished, intuitive design.
-   **Visual Polish:** A subtle noise texture, layered shadows, and clean typography provide a premium user experience.

## **Current Task: Refactor to Web Components**

**Plan:**

1.  **Create Component Files:** Create separate JavaScript files for each web component (`AppHeader.js`, `ControlPanel.js`, `CanvasDisplay.js`, `AppFooter.js`) in a new `/components` directory.
2.  **Implement Component Logic:** Define a class extending `HTMLElement` for each component, encapsulating its specific HTML structure and behavior.
3.  **Refactor `index.html`:** Replace the static HTML with the new custom element tags (`<app-header>`, `<control-panel>`, etc.).
4.  **Update `main.js`:** Modify the main script to act as a coordinator. It will:
    -   Import and define the custom elements.
    -   Listen for custom events dispatched from the components (e.g., `image-uploaded`, `settings-changed`).
    -   Orchestrate the image processing workflow and pass data between components.
