/**
 * 类型定义入口文件
 * 统一导出所有类型，避免重复导入
 */

// 从zhipin.ts导出核心业务类型
export type {
  AttendanceRequirement,
  ScheduleType,
  AttendancePolicy,
  TimeSlotAvailability,
  SchedulingFlexibility,
  Position,
  Store,
  Templates,
  ScreeningRules,
  BrandConfig,
  ZhipinData,
  SampleData,
  ReplyContext,
  CandidateInfo,
  ConversationMessage,
  MessageClassification,
  Extract,
  ReplyArgsMap,
  LLMToolArgs,
} from "./zhipin";

export { ATTENDANCE_PATTERNS } from "./zhipin";

// 从config.ts导出配置相关类型
export type {
  SystemPromptsConfig,
  ReplyPromptsConfig,
  AppConfigData,
  ConfigService,
  ConfigManagerState,
} from "./config";

export { CONFIG_STORAGE_KEY, CONFIG_VERSION } from "./config";

// 导出其他类型
export * from "./image-optimize-type";
export * from "./feishu";
