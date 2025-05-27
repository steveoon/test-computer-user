import { anthropic } from "@ai-sdk/anthropic";
import { tool } from "ai";
import { z } from "zod";
import { getDesktop, withTimeout } from "./utils";
import { compressImage } from "../utils";
import { diagnoseE2BEnvironment } from "./diagnostic";

const wait = async (seconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

// 改进的鼠标移动函数，确保指针可见性
const moveMouseWithVisualUpdate = async (
  desktop: any,
  x: number,
  y: number
) => {
  // 确保坐标在有效范围内
  const clampedX = Math.max(0, Math.min(x, resolution.x - 1));
  const clampedY = Math.max(0, Math.min(y, resolution.y - 1));

  // 主要移动
  await desktop.moveMouse(clampedX, clampedY);

  // 多种方法强制刷新指针可见性
  try {
    // 方法1: 微小抖动
    await desktop.moveMouse(clampedX + 1, clampedY);
    await wait(0.02);
    await desktop.moveMouse(clampedX, clampedY + 1);
    await wait(0.02);
    await desktop.moveMouse(clampedX, clampedY);
    await wait(0.02);

    // 方法2: 尝试系统级命令
    try {
      await desktop.commands.run(`xdotool mousemove ${clampedX} ${clampedY}`);
    } catch {
      // 如果 xdotool 不可用，尝试其他方法
      try {
        await desktop.commands.run(
          `DISPLAY=:1 xdotool mousemove ${clampedX} ${clampedY}`
        );
      } catch {
        // 忽略系统命令失败
      }
    }
  } catch (error) {
    console.warn("Visual mouse pointer update failed:", error);
  }

  return { x: clampedX, y: clampedY };
};

export const resolution = { x: 1024, y: 768 };

// Claude 3.5 compatible computer tool
export const computerTool35 = (sandboxId: string) =>
  anthropic.tools.computer_20241022({
    displayWidthPx: resolution.x,
    displayHeightPx: resolution.y,
    displayNumber: 1,
    execute: async ({ action, coordinate, text }) => {
      const desktop = await getDesktop(sandboxId);

      switch (action) {
        case "screenshot": {
          const image = await desktop.screenshot();
          const base64Data = Buffer.from(image).toString("base64");

          // 直接返回图片，让 prunedMessages 函数处理大小优化
          return {
            type: "image" as const,
            data: base64Data,
          };
        }
        case "left_click": {
          // Claude 3.5 的 computer_20241022 版本中，left_click 不需要 coordinate 参数
          // 需要先用 mouse_move 移动到位置，然后调用 left_click
          await desktop.leftClick();
          return { type: "text" as const, text: `Left clicked` };
        }
        case "double_click": {
          // Claude 3.5 的 computer_20241022 版本中，double_click 不需要 coordinate 参数
          await desktop.doubleClick();
          return {
            type: "text" as const,
            text: `Double clicked`,
          };
        }
        case "right_click": {
          // Claude 3.5 的 computer_20241022 版本中，right_click 不需要 coordinate 参数
          await desktop.rightClick();
          return { type: "text" as const, text: `Right clicked` };
        }
        case "middle_click": {
          // Claude 3.5 的 computer_20241022 版本中，middle_click 不需要 coordinate 参数
          // E2B可能没有middleClick方法，使用替代方案
          try {
            if (typeof desktop.middleClick === "function") {
              await desktop.middleClick();
            } else {
              // 使用按键模拟中键点击
              await desktop.press("Button2");
            }
          } catch (error) {
            console.warn("Middle click not supported:", error);
          }
          return { type: "text" as const, text: `Middle clicked` };
        }
        case "cursor_position": {
          // 获取当前鼠标位置 - E2B可能没有这个方法
          return {
            type: "text" as const,
            text: `Cursor position query not supported in this environment`,
          };
        }
        case "mouse_move": {
          if (!coordinate)
            throw new Error("Coordinate required for mouse move action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          return { type: "text" as const, text: `Moved mouse to ${x}, ${y}` };
        }
        case "type": {
          if (!text) throw new Error("Text required for type action");
          await desktop.write(text);
          return { type: "text" as const, text: `Typed: ${text}` };
        }
        case "key": {
          if (!text) throw new Error("Key required for key action");
          await desktop.press(text === "Return" ? "enter" : text);
          return { type: "text" as const, text: `Pressed key: ${text}` };
        }
        case "left_click_drag": {
          if (!coordinate)
            throw new Error("Coordinate required for drag action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          return {
            type: "text" as const,
            text: `Dragged to ${x}, ${y}`,
          };
        }
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    },
    experimental_toToolResultContent(result) {
      if (typeof result === "string") {
        return [{ type: "text", text: result }];
      }
      if (result.type === "image" && result.data) {
        return [
          {
            type: "image",
            data: result.data,
            mimeType: "image/png",
          },
        ];
      }
      if (result.type === "text" && result.text) {
        return [{ type: "text", text: result.text }];
      }
      throw new Error("Invalid result format");
    },
  });

// Claude 3.7/4 compatible computer tool (Anthropic-specific)
export const anthropicComputerTool = (sandboxId: string) =>
  anthropic.tools.computer_20250124({
    displayWidthPx: resolution.x,
    displayHeightPx: resolution.y,
    displayNumber: 1,
    execute: async ({
      action,
      coordinate,
      text,
      duration,
      scroll_amount,
      scroll_direction,
      start_coordinate,
    }) => {
      const desktop = await getDesktop(sandboxId);

      switch (action) {
        case "screenshot": {
          const image = await desktop.screenshot();
          // Convert image data to base64 immediately
          const base64Data = Buffer.from(image).toString("base64");
          return {
            type: "image" as const,
            data: base64Data,
          };
        }
        case "wait": {
          if (!duration) throw new Error("Duration required for wait action");
          const actualDuration = Math.min(duration, 2);
          await wait(actualDuration);
          return {
            type: "text" as const,
            text: `Waited for ${actualDuration} seconds`,
          };
        }
        case "left_click": {
          if (!coordinate)
            throw new Error("Coordinate required for left click action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          await desktop.leftClick();
          return { type: "text" as const, text: `Left clicked at ${x}, ${y}` };
        }
        case "double_click": {
          if (!coordinate)
            throw new Error("Coordinate required for double click action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          await desktop.doubleClick();
          return {
            type: "text" as const,
            text: `Double clicked at ${x}, ${y}`,
          };
        }
        case "right_click": {
          if (!coordinate)
            throw new Error("Coordinate required for right click action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          await desktop.rightClick();
          return { type: "text" as const, text: `Right clicked at ${x}, ${y}` };
        }
        case "mouse_move": {
          if (!coordinate)
            throw new Error("Coordinate required for mouse move action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          return { type: "text" as const, text: `Moved mouse to ${x}, ${y}` };
        }
        case "type": {
          if (!text) throw new Error("Text required for type action");
          await desktop.write(text);
          return { type: "text" as const, text: `Typed: ${text}` };
        }
        case "key": {
          if (!text) throw new Error("Key required for key action");
          await desktop.press(text === "Return" ? "enter" : text);
          return { type: "text" as const, text: `Pressed key: ${text}` };
        }
        case "scroll": {
          if (!scroll_direction)
            throw new Error("Scroll direction required for scroll action");
          if (!scroll_amount)
            throw new Error("Scroll amount required for scroll action");

          await desktop.scroll(
            scroll_direction as "up" | "down",
            scroll_amount
          );
          return { type: "text" as const, text: `Scrolled ${text}` };
        }
        case "left_click_drag": {
          if (!start_coordinate || !coordinate)
            throw new Error("Coordinate required for mouse move action");
          const [startX, startY] = start_coordinate;
          const [endX, endY] = coordinate;

          await desktop.drag([startX, startY], [endX, endY]);
          return {
            type: "text" as const,
            text: `Dragged mouse from ${startX}, ${startY} to ${endX}, ${endY}`,
          };
        }
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    },
    experimental_toToolResultContent(result) {
      if (typeof result === "string") {
        return [{ type: "text", text: result }];
      }
      if (result.type === "image" && result.data) {
        return [
          {
            type: "image",
            data: result.data,
            mimeType: "image/png",
          },
        ];
      }
      if (result.type === "text" && result.text) {
        return [{ type: "text", text: result.text }];
      }
      throw new Error("Invalid result format");
    },
  });

// Claude 3.5 compatible bash tool
export const bashTool35 = (sandboxId?: string) =>
  anthropic.tools.bash_20241022({
    execute: async ({ command }) => {
      const desktop = await getDesktop(sandboxId);

      try {
        const result = await desktop.commands.run(command);
        return (
          result.stdout || "(Command executed successfully with no output)"
        );
      } catch (error) {
        console.error("Bash command failed:", error);
        if (error instanceof Error) {
          return `Error executing command: ${error.message}`;
        } else {
          return `Error executing command: ${String(error)}`;
        }
      }
    },
  });

// Claude 3.7/4 compatible bash tool (Anthropic-specific)
export const anthropicBashTool = (sandboxId?: string) =>
  anthropic.tools.bash_20250124({
    execute: async ({ command }) => {
      const desktop = await getDesktop(sandboxId);

      try {
        const result = await desktop.commands.run(command);
        return (
          result.stdout || "(Command executed successfully with no output)"
        );
      } catch (error) {
        console.error("Bash command failed:", error);
        if (error instanceof Error) {
          return `Error executing command: ${error.message}`;
        } else {
          return `Error executing command: ${String(error)}`;
        }
      }
    },
  });

// Universal computer tool compatible with all providers
export const computerTool = (sandboxId: string) =>
  tool({
    description:
      "Use a computer to interact with applications and websites. Takes screenshots, clicks, types, and performs other computer actions.",
    parameters: z.object({
      action: z
        .enum([
          "screenshot",
          "left_click",
          "double_click",
          "right_click",
          "middle_click",
          "triple_click",
          "mouse_move",
          "left_mouse_down",
          "left_mouse_up",
          "type",
          "key",
          "hold_key",
          "left_click_drag",
          "cursor_position",
          "scroll",
          "wait",
          "diagnose",
        ])
        .describe("The action to perform"),
      coordinate: z
        .array(z.number())
        .length(2)
        .optional()
        .describe("The [x, y] coordinates for mouse actions"),
      start_coordinate: z
        .array(z.number())
        .length(2)
        .optional()
        .describe("The [x, y] start coordinates for drag actions"),
      text: z.string().optional().describe("Text to type or key to press"),
      duration: z
        .number()
        .optional()
        .describe("Duration in seconds for wait/hold actions"),
      scroll_direction: z
        .enum(["up", "down", "left", "right"])
        .optional()
        .describe("Direction to scroll"),
      scroll_amount: z.number().optional().describe("Amount to scroll"),
    }),
    execute: async ({
      action,
      coordinate,
      start_coordinate,
      text,
      duration,
      scroll_direction,
      scroll_amount,
    }) => {
      const desktop = await getDesktop(sandboxId);

      switch (action) {
        case "screenshot": {
          const image = await desktop.screenshot();
          const base64Data = Buffer.from(image).toString("base64");

          // 压缩图片以减少token使用
          const compressedData = compressImage(base64Data, 400);

          // 返回结构化的图片数据，让 AI SDK 处理
          return {
            type: "image" as const,
            data: compressedData,
          };
        }
        case "left_click": {
          if (coordinate) {
            const [x, y] = coordinate;
            await moveMouseWithVisualUpdate(desktop, x, y);
            // 添加短暂延迟确保鼠标移动完成
            await wait(0.15);
          }

          // 尝试点击，如果失败则重试
          try {
            await desktop.leftClick();
          } catch (error) {
            console.warn("First click attempt failed, retrying...", error);
            await wait(0.1);
            await desktop.leftClick();
          }

          // 添加点击后的短暂延迟
          await wait(0.1);
          return coordinate
            ? `Left clicked at ${coordinate[0]}, ${coordinate[1]}`
            : "Left clicked";
        }
        case "double_click": {
          if (coordinate) {
            const [x, y] = coordinate;
            await moveMouseWithVisualUpdate(desktop, x, y);
            await wait(0.1);
          }
          await desktop.doubleClick();
          await wait(0.2);
          return coordinate
            ? `Double clicked at ${coordinate[0]}, ${coordinate[1]}`
            : "Double clicked";
        }
        case "right_click": {
          if (coordinate) {
            const [x, y] = coordinate;
            await moveMouseWithVisualUpdate(desktop, x, y);
            await wait(0.1);
          }
          await desktop.rightClick();
          await wait(0.1);
          return coordinate
            ? `Right clicked at ${coordinate[0]}, ${coordinate[1]}`
            : "Right clicked";
        }
        case "middle_click": {
          if (coordinate) {
            const [x, y] = coordinate;
            await desktop.moveMouse(x, y);
          }
          try {
            if (typeof desktop.middleClick === "function") {
              await desktop.middleClick();
            } else {
              await desktop.press("Button2");
            }
          } catch (error) {
            console.warn("Middle click not supported:", error);
          }
          return coordinate
            ? `Middle clicked at ${coordinate[0]}, ${coordinate[1]}`
            : "Middle clicked";
        }
        case "cursor_position": {
          return "Cursor position query not supported in this environment";
        }
        case "mouse_move": {
          if (!coordinate)
            throw new Error("Coordinate required for mouse move action");
          const [x, y] = coordinate;

          const { x: finalX, y: finalY } = await moveMouseWithVisualUpdate(
            desktop,
            x,
            y
          );
          await wait(0.1);
          return `Moved mouse to ${finalX}, ${finalY}`;
        }
        case "type": {
          if (!text) throw new Error("Text required for type action");
          await desktop.write(text);
          return `Typed: ${text}`;
        }
        case "key": {
          if (!text) throw new Error("Key required for key action");
          await desktop.press(text === "Return" ? "enter" : text);
          return `Pressed key: ${text}`;
        }
        case "triple_click": {
          if (coordinate) {
            const [x, y] = coordinate;
            await desktop.moveMouse(x, y);
            await wait(0.1);
          }
          // 执行三次点击，间隔适当时间
          await desktop.leftClick();
          await wait(0.05);
          await desktop.leftClick();
          await wait(0.05);
          await desktop.leftClick();
          await wait(0.1);
          return coordinate
            ? `Triple clicked at ${coordinate[0]}, ${coordinate[1]}`
            : "Triple clicked";
        }
        case "left_mouse_down": {
          if (coordinate) {
            const [x, y] = coordinate;
            await desktop.moveMouse(x, y);
          }
          // E2B 可能没有直接的 mouseDown 方法，使用替代方案
          try {
            if (typeof desktop.mouseDown === "function") {
              await desktop.mouseDown();
            } else {
              console.warn("Mouse down not directly supported");
            }
          } catch (error) {
            console.warn("Mouse down not supported:", error);
          }
          return coordinate
            ? `Left mouse down at ${coordinate[0]}, ${coordinate[1]}`
            : "Left mouse down";
        }
        case "left_mouse_up": {
          if (coordinate) {
            const [x, y] = coordinate;
            await desktop.moveMouse(x, y);
          }
          // E2B 可能没有直接的 mouseUp 方法，使用替代方案
          try {
            if (typeof desktop.mouseUp === "function") {
              await desktop.mouseUp();
            } else {
              console.warn("Mouse up not directly supported");
            }
          } catch (error) {
            console.warn("Mouse up not supported:", error);
          }
          return coordinate
            ? `Left mouse up at ${coordinate[0]}, ${coordinate[1]}`
            : "Left mouse up";
        }
        case "hold_key": {
          if (!text) throw new Error("Key required for hold key action");
          if (!duration)
            throw new Error("Duration required for hold key action");
          const actualDuration = Math.min(duration, 5); // 限制最大5秒

          // E2B 可能没有直接的 holdKey 方法，使用按下-等待-释放
          try {
            await desktop.press(text === "Return" ? "enter" : text);
            await wait(actualDuration);
          } catch (error) {
            console.warn("Hold key not fully supported:", error);
          }
          return `Held key: ${text} for ${actualDuration} seconds`;
        }
        case "scroll": {
          if (!scroll_direction)
            throw new Error("Scroll direction required for scroll action");
          if (!scroll_amount)
            throw new Error("Scroll amount required for scroll action");

          try {
            if (coordinate) {
              const [x, y] = coordinate;
              // 确保坐标在有效范围内
              const clampedX = Math.max(0, Math.min(x, resolution.x - 1));
              const clampedY = Math.max(0, Math.min(y, resolution.y - 1));

              await desktop.moveMouse(clampedX, clampedY);
              await wait(0.1);
            }

            // 使用超时保护执行滚动操作
            await withTimeout(
              desktop.scroll(scroll_direction as "up" | "down", scroll_amount),
              5000,
              "Scroll"
            );

            // 滚动后等待一下让页面稳定
            await wait(0.2);

            return `Scrolled ${scroll_direction} by ${scroll_amount} at ${
              coordinate
                ? `${coordinate[0]}, ${coordinate[1]}`
                : "current position"
            }`;
          } catch (error) {
            console.warn("Scroll operation failed:", error);
            // 如果滚动失败，尝试使用键盘滚动作为备选方案
            try {
              const scrollKey =
                scroll_direction === "up" ? "Page_Up" : "Page_Down";
              for (let i = 0; i < Math.min(scroll_amount, 3); i++) {
                await desktop.press(scrollKey);
                await wait(0.1);
              }
              return `Scrolled ${scroll_direction} using keyboard (fallback method)`;
            } catch (fallbackError) {
              console.error("Fallback scroll also failed:", fallbackError);
              return `Scroll attempt failed: ${
                error instanceof Error ? error.message : "Unknown error"
              }`;
            }
          }
        }
        case "wait": {
          if (!duration) throw new Error("Duration required for wait action");
          const actualDuration = Math.min(duration, 5); // 限制最大5秒
          await wait(actualDuration);
          return `Waited for ${actualDuration} seconds`;
        }
        case "left_click_drag": {
          if (!start_coordinate || !coordinate)
            throw new Error(
              "Start and end coordinates required for drag action"
            );
          const [startX, startY] = start_coordinate;
          const [endX, endY] = coordinate;

          try {
            // 确保坐标在有效范围内
            const clampedStartX = Math.max(
              0,
              Math.min(startX, resolution.x - 1)
            );
            const clampedStartY = Math.max(
              0,
              Math.min(startY, resolution.y - 1)
            );
            const clampedEndX = Math.max(0, Math.min(endX, resolution.x - 1));
            const clampedEndY = Math.max(0, Math.min(endY, resolution.y - 1));

            // 添加超时保护
            await withTimeout(
              desktop.drag(
                [clampedStartX, clampedStartY],
                [clampedEndX, clampedEndY]
              ),
              10000,
              "Drag"
            );
            await wait(0.2);

            return `Dragged from ${clampedStartX}, ${clampedStartY} to ${clampedEndX}, ${clampedEndY}`;
          } catch (error) {
            console.warn("Drag operation failed:", error);
            return `Drag attempt failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`;
          }
        }
        case "diagnose": {
          // 运行 E2B 环境诊断
          await diagnoseE2BEnvironment(sandboxId);
          return "E2B 环境诊断完成，请查看控制台输出获取详细信息";
        }
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    },
    experimental_toToolResultContent(result) {
      if (typeof result === "string") {
        return [{ type: "text", text: result }];
      }
      if (result && typeof result === "object" && "type" in result) {
        const resultObj = result as any;
        if (resultObj.type === "image" && "data" in resultObj) {
          return [
            {
              type: "image",
              data: resultObj.data as string,
              mimeType: "image/png",
            },
          ];
        }
        if (resultObj.type === "text" && "text" in resultObj) {
          return [{ type: "text", text: resultObj.text as string }];
        }
      }
      return [{ type: "text", text: String(result) }];
    },
  });

// Universal bash tool compatible with all providers
export const bashTool = (sandboxId?: string) =>
  tool({
    description: "Execute bash commands on the computer system",
    parameters: z.object({
      command: z.string().describe("The bash command to execute"),
    }),
    execute: async ({ command }) => {
      const desktop = await getDesktop(sandboxId);

      try {
        const result = await desktop.commands.run(command);
        return (
          result.stdout || "(Command executed successfully with no output)"
        );
      } catch (error) {
        console.error("Bash command failed:", error);
        if (error instanceof Error) {
          return `Error executing command: ${error.message}`;
        } else {
          return `Error executing command: ${String(error)}`;
        }
      }
    },
  });

// Backward compatibility aliases
export const anthropicComputerTool35 = computerTool35;
export const anthropicBashTool35 = bashTool35;
