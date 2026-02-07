const imageUpload = document.getElementById('imageUpload');
const originalCanvas = document.getElementById('originalCanvas');
const coloringCanvas = document.getElementById('coloringCanvas');
const convertBtn = document.getElementById('convertBtn');
const printBtn = document.getElementById('printBtn');

const originalCtx = originalCanvas.getContext('2d');
const coloringCtx = coloringCanvas.getContext('2d');

let uploadedImage = null;

imageUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      uploadedImage = img;

      // Set originalCanvas dimensions to match image
      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      
      // Define A4 dimensions for display (e.g., at 96 DPI)
      const a4WidthPx = 794; // approx 210mm at 96 DPI
      const a4HeightPx = 1122; // approx 297mm at 96 DPI

      // Set coloringCanvas dimensions to A4 aspect ratio for consistent display
      coloringCanvas.width = a4WidthPx;
      coloringCanvas.height = a4HeightPx;

      originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
      originalCtx.drawImage(img, 0, 0);

      convertBtn.disabled = false;
      printBtn.disabled = true; // Disable print until conversion

      // Clear coloring canvas if a new image is uploaded
      coloringCtx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

function convertImageToColoringPage() {
  // Use the original image's dimensions for processing to maintain detail
  const processingWidth = uploadedImage.width;
  const processingHeight = uploadedImage.height;

  // Draw the original image onto a temporary canvas for processing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = processingWidth;
  tempCanvas.height = processingHeight;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(uploadedImage, 0, 0, processingWidth, processingHeight);

  const imageData = tempCtx.getImageData(0, 0, processingWidth, processingHeight);
  const data = imageData.data;
  
  // Create a temporary output canvas for the processed image at its original resolution
  const processedTempCanvas = document.createElement('canvas');
  processedTempCanvas.width = processingWidth;
  processedTempCanvas.height = processingHeight;
  const processedTempCtx = processedTempCanvas.getContext('2d');
  const outputImageData = processedTempCtx.createImageData(processingWidth, processingHeight);
  const outputData = outputImageData.data;

  // Grayscale and simple edge detection
  const threshold = 100; // Adjust for sensitivity of edge detection

  for (let y = 0; y < processingHeight; y++) {
    for (let x = 0; x < processingWidth; x++) {
      const i = (y * processingWidth + x) * 4;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Convert to grayscale (luminance method)
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // Apply edge detection
      let isEdge = false;
      if (x < processingWidth - 1) { // Check right neighbor
        const iRight = (y * processingWidth + (x + 1)) * 4;
        const rRight = data[iRight];
        const gRight = data[iRight + 1];
        const bRight = data[iRight + 2];
        const grayRight = 0.2126 * rRight + 0.7152 * gRight + 0.0722 * bRight;
        if (Math.abs(gray - grayRight) > threshold) {
          isEdge = true;
        }
      }
      if (!isEdge && y < processingHeight - 1) { // Check bottom neighbor if not already an edge
        const iBottom = ((y + 1) * processingWidth + x) * 4;
        const rBottom = data[iBottom];
        const gBottom = data[iBottom + 1];
        const bBottom = data[iBottom + 2];
        const grayBottom = 0.2126 * rBottom + 0.7152 * gBottom + 0.0722 * bBottom;
        if (Math.abs(gray - grayBottom) > threshold) {
          isEdge = true;
        }
      }

      if (isEdge) {
        outputData[i] = 0;     // Black
        outputData[i + 1] = 0;
        outputData[i + 2] = 0;
        outputData[i + 3] = 255; // Opaque
      } else {
        outputData[i] = 255;     // White
        outputData[i + 1] = 255;
        outputData[i + 2] = 255;
        outputData[i + 3] = 255; // Opaque
      }
    }
  }

  processedTempCtx.putImageData(outputImageData, 0, 0);

  // Now, draw the processed image onto the main coloringCanvas, scaling to fit its A4 dimensions
  // Clear the coloringCanvas first to ensure a clean slate
  coloringCtx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
  
  // Calculate scaling to fit the processed image into the coloringCanvas (A4 aspect ratio)
  const scale = Math.min(coloringCanvas.width / processingWidth, coloringCanvas.height / processingHeight);
  const scaledWidth = processingWidth * scale;
  const scaledHeight = processingHeight * scale;
  const xOffset = (coloringCanvas.width - scaledWidth) / 2;
  const yOffset = (coloringCanvas.height - scaledHeight) / 2;

  // Draw scaled image centered on the coloringCanvas
  coloringCtx.drawImage(processedTempCanvas, xOffset, yOffset, scaledWidth, scaledHeight);
}

convertBtn.addEventListener('click', () => {
  if (!uploadedImage) {
    alert('Please upload an image first.');
    return;
  }
  console.log('Converting image...');
  convertImageToColoringPage();
  printBtn.disabled = false;
});

printBtn.addEventListener('click', () => {
  console.log('Printing coloring page...');
  window.print();
});
