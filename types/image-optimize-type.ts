export interface CompressionConfig {
  targetSizeKB: number;
  maxSizeKB: number;
  minQuality: number;
  maxQuality: number;
  enableAdaptive: boolean;
  preserveText: boolean;
}

export interface CompressionResult {
  base64: string;
  originalSizeKB: number;
  finalSizeKB: number;
  compressionRatio: number;
  quality: number;
  processingTime: number;
}

// 🔬 图像特征分析结果接口
export interface ImageAnalysis {
  readonly isHighRes: boolean;
  readonly isWidescreen: boolean;
  readonly likelyScreenshot: boolean;
  readonly density: number;
  readonly aspectRatio: number;
  readonly originalSize: number;
  readonly width: number;
  readonly height: number;
}

// 🎛️ 压缩参数接口
export interface CompressionParams {
  readonly width: number;
  readonly height: number;
  readonly quality: number;
  readonly preserveText: boolean;
}

// 🏆 最佳压缩结果接口
export interface BestCompressionResult {
  readonly base64: string;
  readonly quality: number;
  readonly sizeKB: number;
}

// 📐 最优尺寸配置接口
export interface OptimalDimensions {
  readonly width: number;
  readonly height: number;
}
