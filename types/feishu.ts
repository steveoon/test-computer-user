// 飞书通知相关类型定义

/**
 * 飞书通知类型枚举
 *
 * @description 支持的通知类型，用于区分不同场景的飞书消息推送
 */
export type FeishuNotificationType =
  | "candidate_wechat" // 候选人微信信息推送
  | "payload_error" // 载荷过大错误警告
  | "task_completed" // 任务完成通知
  | "task_interrupted" // 任务中断通知
  | "system_warning" // 系统警告通知
  | "custom"; // 自定义通知

/**
 * 飞书通知选项配置
 *
 * @description 发送飞书通知时的可选参数配置
 */
export interface FeishuNotificationOptions {
  /** 候选人姓名（candidate_wechat 类型时必需） */
  readonly candidate_name?: string;

  /** 候选人微信号（candidate_wechat 类型时必需） */
  readonly wechat_id?: string;

  /** 附加信息，用于提供更详细的通知内容 */
  readonly additional_info?: string;

  /** 自定义消息内容，覆盖默认生成的消息 */
  readonly message?: string;

  /** 消息类型，默认为 text */
  readonly messageType?: "text" | "rich_text";
}

/**
 * 飞书 API 响应类型
 *
 * @description 飞书机器人 webhook 的标准响应格式
 */
export interface FeishuApiResponse {
  readonly code: number;
  readonly msg?: string;
  readonly StatusMessage?: string;
  readonly data?: unknown;
}

/**
 * 飞书消息发送结果
 *
 * @description 统一的飞书消息发送结果格式
 */
export interface FeishuMessageResult {
  readonly success: boolean;
  readonly data?: FeishuApiResponse;
  readonly error?: string;
}

/**
 * 飞书通知标签映射
 *
 * @description 通知类型对应的中文标签，用于日志和UI显示
 */
export const FEISHU_NOTIFICATION_LABELS = {
  candidate_wechat: "候选人微信通知",
  payload_error: "载荷过大错误通知",
  task_completed: "任务完成通知",
  task_interrupted: "任务中断通知",
  system_warning: "系统警告通知",
  custom: "自定义通知",
} as const satisfies Record<FeishuNotificationType, string>;

/**
 * 飞书通知工具参数
 *
 * @description 用于 AI 工具调用的标准参数格式
 */
export interface FeishuToolParams {
  readonly notification_type: FeishuNotificationType;
  readonly messageType: "text" | "rich_text";
  readonly candidate_name?: string;
  readonly wechat_id?: string;
  readonly additional_info?: string;
  readonly message?: string;
}
