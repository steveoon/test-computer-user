/**
 * 反爬虫检测规避工具函数
 * 
 * 这些函数用于模拟真实用户行为，降低被反爬虫系统检测的风险
 */

/**
 * 生成随机延迟
 * @param min 最小延迟时间（毫秒）
 * @param max 最大延迟时间（毫秒）
 * @returns Promise that resolves after random delay
 */
export const randomDelay = (min: number = 50, max: number = 300): Promise<void> => {
  const delay = min + Math.random() * (max - min);
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * 生成人性化的延迟时间
 * 模拟真实用户的操作节奏，包含偶尔的长时间停顿
 */
export const humanDelay = (): Promise<void> => {
  const rand = Math.random();
  if (rand < 0.7) {
    // 70% 概率：快速操作 100-500ms
    return randomDelay(100, 500);
  } else if (rand < 0.95) {
    // 25% 概率：正常操作 500-1500ms
    return randomDelay(500, 1500);
  } else {
    // 5% 概率：思考时间 1500-3000ms
    return randomDelay(1500, 3000);
  }
};

/**
 * 生成用于替代 console.log 的混淆日志
 * 避免关键词被检测
 */
export const obfuscatedLog = (message: string): string => {
  // 替换敏感关键词
  const replacements: Record<string, string> = {
    'candidate': 'c4nd1d',
    'Candidate': 'C4nd1d',
    'candidates': 'c4nd1ds',
    'Processed': 'Pr0c3ss3d',
    'Found': 'F0und',
    'chat': 'ch4t',
    'message': 'm3ss4g3',
    'unread': 'unr34d',
    'click': 'cl1ck',
  };

  let obfuscated = message;
  Object.entries(replacements).forEach(([key, value]) => {
    obfuscated = obfuscated.replace(new RegExp(key, 'g'), value);
  });

  // 添加随机 Unicode 字符作为前缀
  const randomPrefix = String.fromCharCode(0x2000 + Math.floor(Math.random() * 0x100));
  return `${randomPrefix}${obfuscated}`;
};

/**
 * 生成分批处理的脚本，避免大量DOM查询
 * @param processingLogic 处理逻辑的字符串
 * @param batchSize 每批处理的元素数量
 */
export const generateBatchProcessingScript = (
  processingLogic: string,
  batchSize: number = 10
): string => {
  return `
    // 分批处理函数
    const processBatch = (elements, startIndex, batchSize) => {
      const endIndex = Math.min(startIndex + batchSize, elements.length);
      const batchResults = [];
      
      for (let idx = startIndex; idx < endIndex; idx++) {
        const element = elements[idx];
        const i = idx; // 保持兼容性
        const results = batchResults; // 为 processingLogic 提供 results 引用
        try {
          ${processingLogic}
        } catch (err) {
          // 静默处理错误，避免暴露
        }
      }
      
      return { results: batchResults, nextIndex: endIndex };
    };
    
    // 使用 requestIdleCallback 调度批处理
    const processAllBatches = (elements) => {
      return new Promise((resolve) => {
        const allResults = [];
        let currentIndex = 0;
        
        const processNext = () => {
          if (currentIndex >= elements.length) {
            resolve(allResults);
            return;
          }
          
          // 如果支持 requestIdleCallback，使用它
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback((deadline) => {
              // 在空闲时间处理，但不超过 50ms
              while (currentIndex < elements.length && deadline.timeRemaining() > 0) {
                const batch = processBatch(elements, currentIndex, ${batchSize});
                allResults.push(...batch.results);
                currentIndex = batch.nextIndex;
              }
              processNext();
            });
          } else {
            // 降级到 setTimeout
            setTimeout(() => {
              const batch = processBatch(elements, currentIndex, ${batchSize});
              allResults.push(...batch.results);
              currentIndex = batch.nextIndex;
              processNext();
            }, 10 + Math.random() * 40); // 10-50ms 随机延迟
          }
        };
        
        processNext();
      });
    };
  `;
};

/**
 * 生成随机鼠标移动脚本
 * 模拟真实的鼠标轨迹
 */
export const generateMouseMovementScript = (): string => {
  return `
    // 生成贝塞尔曲线轨迹
    const generateBezierPath = (start, end, steps = 20) => {
      const points = [];
      
      // 生成控制点
      const cp1 = {
        x: start.x + (end.x - start.x) * 0.25 + (Math.random() - 0.5) * 100,
        y: start.y + (end.y - start.y) * 0.25 + (Math.random() - 0.5) * 100
      };
      const cp2 = {
        x: start.x + (end.x - start.x) * 0.75 + (Math.random() - 0.5) * 100,
        y: start.y + (end.y - start.y) * 0.75 + (Math.random() - 0.5) * 100
      };
      
      // 生成路径点
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = Math.pow(1 - t, 3) * start.x +
                  3 * Math.pow(1 - t, 2) * t * cp1.x +
                  3 * (1 - t) * Math.pow(t, 2) * cp2.x +
                  Math.pow(t, 3) * end.x;
        const y = Math.pow(1 - t, 3) * start.y +
                  3 * Math.pow(1 - t, 2) * t * cp1.y +
                  3 * (1 - t) * Math.pow(t, 2) * cp2.y +
                  Math.pow(t, 3) * end.y;
        points.push({ x: Math.round(x), y: Math.round(y) });
      }
      
      return points;
    };
    
    // 触发鼠标移动事件
    const triggerMouseMove = (x, y) => {
      const event = new MouseEvent('mousemove', {
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        view: window
      });
      document.elementFromPoint(x, y)?.dispatchEvent(event);
    };
  `;
};

/**
 * 生成随机滚动脚本
 * 模拟用户浏览行为
 */
export const generateRandomScrollScript = (): string => {
  const scrollDistance = 50 + Math.random() * 150; // 50-200px
  const duration = 200 + Math.random() * 300; // 200-500ms
  
  return `
    // 平滑滚动
    const smoothScroll = (distance, duration) => {
      const start = window.pageYOffset;
      const startTime = performance.now();
      
      const scroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, start + distance * easeProgress);
        
        if (progress < 1) {
          requestAnimationFrame(scroll);
        }
      };
      
      requestAnimationFrame(scroll);
    };
    
    smoothScroll(${scrollDistance}, ${duration});
  `;
};

/**
 * 混淆选择器字符串
 * 避免选择器模式被识别
 */
export const obfuscateSelector = (selector: string): string => {
  // 对于简单选择器，添加随机属性选择器
  if (selector.match(/^[.#][\w-]+$/)) {
    const randomAttr = `[data-${Math.random().toString(36).substr(2, 5)}]`;
    return `${selector}:not(${randomAttr})`;
  }
  return selector;
};

/**
 * 生成防检测的 evaluate 脚本包装器
 * 添加各种防检测措施
 * 注意：MCP 会将脚本包装在 (function() { script })() 中，所以我们不能返回 IIFE
 */
export const wrapAntiDetectionScript = (innerScript: string): string => {
  // 生成随机延迟时间
  const randomDelayMs = Math.floor(Math.random() * 100);
  
  // 判断脚本是否包含 await 关键字
  const hasAwait = innerScript.includes('await ');
  
  if (hasAwait) {
    // 对于包含 await 的脚本，返回 async 函数体
    return `
      // 防检测包装器
      return (async () => {
        // 防检测延迟
        await new Promise(r => setTimeout(r, ${randomDelayMs}));
        
        // 临时禁用console
        const originalLog = console.log;
        const originalWarn = console.warn; 
        const originalError = console.error;
        
        console.log = () => {};
        console.warn = () => {};
        console.error = () => {};
        
        try {
          // 执行内部脚本
          ${innerScript}
        } finally {
          // 恢复console
          console.log = originalLog;
          console.warn = originalWarn;
          console.error = originalError;
        }
      })();
    `;
  } else {
    // 对于同步脚本，返回同步函数体
    return `
      // 防检测包装器
      // 临时禁用console
      const originalLog = console.log;
      const originalWarn = console.warn; 
      const originalError = console.error;
      
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      
      try {
        // 执行内部脚本
        ${innerScript}
      } finally {
        // 恢复console
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
      }
    `;
  }
};

/**
 * 检查是否应该添加额外的随机行为
 * 基于概率决定是否执行额外的迷惑行为
 */
export const shouldAddRandomBehavior = (probability: number = 0.3): boolean => {
  return Math.random() < probability;
};

/**
 * 生成随机的键盘输入延迟
 * 模拟真实的打字速度
 */
export const generateTypingDelay = (): number => {
  // 基础延迟 60-120ms
  const baseDelay = 60 + Math.random() * 60;
  
  // 10% 概率出现较长延迟（思考）
  if (Math.random() < 0.1) {
    return baseDelay + 200 + Math.random() * 300;
  }
  
  // 5% 概率出现很短延迟（快速输入）
  if (Math.random() < 0.05) {
    return 30 + Math.random() * 30;
  }
  
  return baseDelay;
};