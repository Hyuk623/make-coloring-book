# Coloring Book Website Blueprint

## Project Overview
This project aims to create a simple web application that allows users to upload an image and convert it into a coloring book page. The conversion process will result in a black outline on a white background, formatted for A4 printing.

## Implemented Features
### Initial Version
- Basic HTML structure (`index.html`)
- Basic CSS styling (`style.css`)
- Basic JavaScript setup (`main.js`)
- Threshold slider for adjusting conversion sensitivity.

## Current Plan: Enhance Coloring Book Image Conversion with Advanced Filters

### Subtasks:
1.  **Set up basic HTML structure:** Add file input, canvas elements for original and processed images, and buttons for convert and print. (Completed)
2.  **Implement image loading and display:** Read uploaded image file and draw the original image on a canvas. (Completed)
3.  **Develop image processing logic for outline conversion (Initial simple edge detection):** Create functions for grayscale conversion, edge detection, and color inversion (black outlines on white background). (Completed)
4.  **Integrate A4 sizing:** Set canvas dimensions to A4 aspect ratio and ensure proper scaling for display and printing. (Completed)
5.  **Implement printing functionality.** (Completed)
6.  **Refine UI/UX and styling:** Implemented threshold slider for real-time adjustment. (Completed)
7.  **Implement Sobel filter for enhanced edge detection:** Replace the current simple edge detection logic with a more robust Sobel filter algorithm to produce cleaner and more accurate outlines. (Completed)
8.  **Add Gaussian Blur pre-processing:** Apply Gaussian blur to the grayscale image data before applying the Sobel filter to further reduce noise and improve edge detection accuracy. (Completed)
9.  **Add URL-based image loading feature:** Allow users to input an image URL to load and convert images. (Completed)
10. **가우시안 블러 강도 조절 기능 추가:** 블러 강도를 제어하는 UI 슬라이더를 추가하고, `convertImageToColoringPage` 함수에서 가우시안 블러 커널을 동적으로 생성하도록 개선합니다. (Pending)
11. **비최대 억제(Non-Maximum Suppression, NMS) 구현:** Sobel 필터로 계산된 엣지 강도에 NMS를 적용하여 엣지 선을 한 픽셀 두께로 얇고 깔끔하게 만듭니다. (Pending)