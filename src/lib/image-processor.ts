declare const cv: any; // Global OpenCV instance

export class ImageProcessor {
  // Deteksi kontur terbesar (asumsi itu adalah kertas/dokumen)
  public static async detectDocument(imageSource: HTMLCanvasElement | HTMLImageElement) {
    let src = cv.imread(imageSource);
    let dst = cv.matOffset(src, cv.CV_8UC1);
    
    // 1. Grayscale & Blur
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
    
    // 2. Canny Edge Detection
    cv.Canny(dst, dst, 75, 200);
    
    // 3. Find Contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(dst, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    
    let maxArea = 0;
    let documentContour = null;

    for (let i = 0; i < contours.size(); ++i) {
      let cnt = contours.get(i);
      let area = cv.contourArea(cnt);
      let perimeter = cv.arcLength(cnt, true);
      let approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * perimeter, true);

      // Cari kontur dengan 4 titik (persegi panjang) dan area terbesar
      if (approx.rows === 4 && area > maxArea) {
        maxArea = area;
        documentContour = approx;
      }
    }

    // Clean up memory
    src.delete(); dst.delete(); hierarchy.delete();
    return documentContour;
  }

  // Filter "Magic Color" agar hasil scan putih bersih seperti fotokopi
  public static applyMagicColor(canvas: HTMLCanvasElement) {
    let src = cv.imread(canvas);
    let dst = new cv.Mat();
    
    // Adaptive Thresholding untuk memisahkan teks dari background
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    cv.adaptiveThreshold(src, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
    
    cv.imshow(canvas, dst);
    src.delete(); dst.delete();
  }

  public static warpPerspective(canvas: HTMLCanvasElement, contour: any) {
    let src = cv.imread(canvas);
    let dst = new cv.Mat();
    
    // Tentukan urutan titik kontur (Top-Left, Top-Right, Bottom-Right, Bottom-Left)
    let rect = cv.rotatedRectPoints(cv.minAreaRect(contour));
    let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
      rect[1].x, rect[1].y, rect[2].x, rect[2].y, 
      rect[3].x, rect[3].y, rect[0].x, rect[0].y
    ]);

    // Tentukan dimensi hasil (A4 ratio atau sesuai input)
    const width = canvas.width;
    const height = canvas.height;
    let dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, width, height, 0, height]);

    // Lakukan Warp
    let M = cv.getPerspectiveTransform(srcCoords, dstCoords);
    cv.warpPerspective(src, dst, M, new cv.Size(width, height));
    
    cv.imshow(canvas, dst);
    
    // Cleanup
    src.delete(); dst.delete(); M.delete(); srcCoords.delete(); dstCoords.delete();
  }
}