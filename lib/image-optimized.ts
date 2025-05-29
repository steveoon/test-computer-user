"use server";

import sharp from "sharp";

// 服务端图片压缩函数
export async function compressImageServer(
  base64Data: string,
  maxSizeKB: number = 100
): Promise<string> {
  // 计算当前图片大小（KB）
  const currentSizeKB = (base64Data.length * 3) / 4 / 1024;

  try {
    // 将 base64 转换为 Buffer
    const buffer = Buffer.from(base64Data, "base64");

    // 如果图片小于阈值，只做格式转换，不做压缩
    if (currentSizeKB <= maxSizeKB) {
      console.log(
        `图片大小: ${currentSizeKB.toFixed(
          2
        )}KB, 低于阈值 ${maxSizeKB}KB, 仅转换格式`
      );

      const convertedBuffer = await sharp(buffer)
        .grayscale() // 转换为灰度图像
        .jpeg({
          quality: 85, // 高质量，不压缩
          progressive: true,
          optimiseCoding: true,
          force: true,
        })
        .toBuffer();

      const convertedBase64 = convertedBuffer.toString("base64");
      const convertedSizeKB = (convertedBase64.length * 3) / 4 / 1024;

      console.log(
        `格式转换完成: ${currentSizeKB.toFixed(
          2
        )}KB -> ${convertedSizeKB.toFixed(2)}KB`
      );
      return convertedBase64;
    }

    console.log(`图片大小: ${currentSizeKB.toFixed(2)}KB, 开始优化...`);

    // 获取图像的原始尺寸
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 1024;
    const originalHeight = metadata.height || 768;

    // 计算新的尺寸，使用更保守的缩放比例
    let scale = 0.85; // 默认缩放比例（更保守）
    if (currentSizeKB > 300) {
      scale = 0.75; // 很大的图片稍微多压缩一些
    }

    const newWidth = Math.round(originalWidth * scale);
    const newHeight = Math.round(originalHeight * scale);

    // 使用 sharp 处理图像
    const processedImageBuffer = await sharp(buffer)
      .grayscale() // 转换为灰度图像
      .resize({
        width: newWidth,
        height: newHeight,
        fit: "inside",
      })
      .jpeg({
        quality: 50, // 提升质量设置，保持定位准确度
        progressive: true,
        optimiseCoding: true,
        force: true,
      })
      .toBuffer();

    // 转换回 base64
    const optimizedBase64 = processedImageBuffer.toString("base64");
    const newSizeKB = (optimizedBase64.length * 3) / 4 / 1024;

    // 如果优化后反而变大了，则返回格式转换版本
    if (newSizeKB >= currentSizeKB) {
      console.log(`优化后图片变大，返回格式转换版本`);
      const fallbackBuffer = await sharp(buffer)
        .grayscale()
        .jpeg({ quality: 85, force: true })
        .toBuffer();
      return fallbackBuffer.toString("base64");
    }

    console.log(
      `图片已优化: ${currentSizeKB.toFixed(2)}KB -> ${newSizeKB.toFixed(
        2
      )}KB (${Math.round((1 - newSizeKB / currentSizeKB) * 100)}% 减少)`
    );

    return optimizedBase64;
  } catch (error) {
    console.error("图片处理失败:", error);
    // 即使失败也要尝试格式转换
    try {
      const buffer = Buffer.from(base64Data, "base64");
      const fallbackBuffer = await sharp(buffer)
        .grayscale()
        .jpeg({ quality: 80, force: true })
        .toBuffer();
      return fallbackBuffer.toString("base64");
    } catch (fallbackError) {
      console.error("格式转换也失败:", fallbackError);
      return base64Data;
    }
  }
}
