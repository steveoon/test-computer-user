import { z } from "zod";

// Boss直聘相关数据类型定义

// 预定义常见出勤模式
export const ATTENDANCE_PATTERNS = {
  WEEKENDS: [6, 7],
  WEEKDAYS: [1, 2, 3, 4, 5],
  FRIDAY_TO_SUNDAY: [5, 6, 7],
  EVERYDAY: [1, 2, 3, 4, 5, 6, 7],
} as const;

// 🔧 Zod Schema 定义

// 出勤要求Schema
export const AttendanceRequirementSchema = z.object({
  requiredDays: z.array(z.number().min(1).max(7)).optional(),
  minimumDays: z.number().min(0).optional(),
  description: z.string(),
});

// 排班类型Schema
export const ScheduleTypeSchema = z.enum([
  "fixed",
  "flexible",
  "rotating",
  "on_call",
]);

// 考勤政策Schema
export const AttendancePolicySchema = z.object({
  punctualityRequired: z.boolean(),
  lateToleranceMinutes: z.number().min(0),
  attendanceTracking: z.enum(["strict", "flexible", "none"]),
  makeupShiftsAllowed: z.boolean(),
});

// 时间段可用性Schema
export const TimeSlotAvailabilitySchema = z.object({
  slot: z.string(),
  maxCapacity: z.number().min(0),
  currentBooked: z.number().min(0),
  isAvailable: z.boolean(),
  priority: z.enum(["high", "medium", "low"]),
});

// 排班灵活性Schema
export const SchedulingFlexibilitySchema = z.object({
  canSwapShifts: z.boolean(),
  advanceNoticeHours: z.number().min(0),
  partTimeAllowed: z.boolean(),
  weekendRequired: z.boolean(),
  holidayRequired: z.boolean(),
});

// 岗位Schema
export const PositionSchema = z.object({
  id: z.string(),
  name: z.string(),
  timeSlots: z.array(z.string()),
  baseSalary: z.number().min(0),
  levelSalary: z.string(),
  workHours: z.string(),
  benefits: z.string(),
  requirements: z.array(z.string()),
  urgent: z.boolean(),
  scheduleType: ScheduleTypeSchema,
  attendancePolicy: AttendancePolicySchema,
  availableSlots: z.array(TimeSlotAvailabilitySchema),
  schedulingFlexibility: SchedulingFlexibilitySchema,
  minHoursPerWeek: z.number().min(0).optional(),
  maxHoursPerWeek: z.number().min(0).optional(),
  preferredDays: z.array(z.string()).optional(),
  blackoutDates: z.array(z.string()).optional(),
  attendanceRequirement: AttendanceRequirementSchema.optional(),
});

// 门店Schema
export const StoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  district: z.string(),
  subarea: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  transportation: z.string(),
  positions: z.array(PositionSchema),
  brand: z.string(),
});

// 回复上下文类型Schema
export const ReplyContextSchema = z.enum([
  "initial_inquiry",
  "location_inquiry",
  "location_match",
  "no_location_match",
  "schedule_inquiry",
  "interview_request",
  "general_chat",
  "salary_inquiry",
  "age_concern",
  "insurance_inquiry",
  "followup_chat",
  "attendance_inquiry",
  "flexibility_inquiry",
  "attendance_policy_inquiry",
  "work_hours_inquiry",
  "availability_inquiry",
  "part_time_support",
]);

// 模板Schema（支持所有回复类型）
export const TemplatesSchema = z
  .record(
    z.enum([
      // ReplyContext类型
      "initial_inquiry",
      "location_inquiry",
      "location_match",
      "no_location_match",
      "schedule_inquiry",
      "interview_request",
      "general_chat",
      "salary_inquiry",
      "age_concern",
      "insurance_inquiry",
      "followup_chat",
      "attendance_inquiry",
      "flexibility_inquiry",
      "attendance_policy_inquiry",
      "work_hours_inquiry",
      "availability_inquiry",
      "part_time_support",
      // 额外的模板类型
      "proactive",
      "inquiry",
      "no_match",
      "interview",
      "followup",
    ]),
    z.array(z.string())
  )
  .optional();

// 筛选规则Schema
export const ScreeningRulesSchema = z.object({
  age: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    preferred: z.array(z.number()),
  }),
  blacklistKeywords: z.array(z.string()),
  preferredKeywords: z.array(z.string()),
});

// 品牌配置Schema
export const BrandConfigSchema = z.object({
  templates: TemplatesSchema.refine((val) => val !== undefined, {
    message: "品牌配置必须包含templates字段",
  }),
  screening: ScreeningRulesSchema,
});

// Boss直聘数据Schema
export const ZhipinDataSchema = z.object({
  city: z.string(),
  stores: z.array(StoreSchema),
  brands: z.record(BrandConfigSchema),
  defaultBrand: z.string().optional(),
  templates: TemplatesSchema,
  screening: ScreeningRulesSchema.optional(),
});

// 示例数据Schema
export const SampleDataSchema = z.object({
  zhipin: ZhipinDataSchema,
});

// 候选人信息Schema
export const CandidateInfoSchema = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
  location: z.string().optional(),
  experience: z.string().optional(),
  availability: z.string().optional(),
});

// 对话消息Schema
export const ConversationMessageSchema = z.object({
  role: z.enum(["candidate", "recruiter"]),
  message: z.string(),
  timestamp: z.string().optional(),
});

// LLM工具参数基础Schema
export const BaseReplyArgsSchema = z.object({
  city: z.string().optional(),
  brand: z.string().optional(),
});

// 消息分类结果Schema
export const MessageClassificationSchema = z.object({
  replyType: ReplyContextSchema,
  extractedInfo: z.object({
    mentionedBrand: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    mentionedLocations: z
      .array(
        z.object({
          location: z.string(),
          confidence: z.number(),
        })
      )
      .nullable()
      .optional(),
    mentionedDistrict: z.string().nullable().optional(),
    specificAge: z.number().nullable().optional(),
    hasUrgency: z.boolean().nullable().optional(),
    preferredSchedule: z.string().nullable().optional(),
  }),
  reasoning: z.string(),
});

// 🔧 通过 z.infer 生成 TypeScript 类型

export type AttendanceRequirement = z.infer<typeof AttendanceRequirementSchema>;
export type ScheduleType = z.infer<typeof ScheduleTypeSchema>;
export type AttendancePolicy = z.infer<typeof AttendancePolicySchema>;
export type TimeSlotAvailability = z.infer<typeof TimeSlotAvailabilitySchema>;
export type SchedulingFlexibility = z.infer<typeof SchedulingFlexibilitySchema>;
export type Position = z.infer<typeof PositionSchema>;
export type Store = z.infer<typeof StoreSchema>;
export type Templates = z.infer<typeof TemplatesSchema>;
export type ScreeningRules = z.infer<typeof ScreeningRulesSchema>;
export type BrandConfig = z.infer<typeof BrandConfigSchema>;
export type ZhipinData = z.infer<typeof ZhipinDataSchema>;
export type SampleData = z.infer<typeof SampleDataSchema>;
export type ReplyContext = z.infer<typeof ReplyContextSchema>;
export type CandidateInfo = z.infer<typeof CandidateInfoSchema>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
export type MessageClassification = z.infer<typeof MessageClassificationSchema>;

// 🔧 LLM工具参数类型映射（使用类型而非Schema，因为过于复杂）
export type ReplyArgsMap = {
  initial_inquiry: z.infer<typeof BaseReplyArgsSchema> & {
    workHours?: string;
    baseSalary?: number;
    levelSalary?: string;
  };
  location_inquiry: z.infer<typeof BaseReplyArgsSchema>;
  location_match: {
    location: string;
    district: string;
    storeName: string;
    position: string;
    schedule: string;
  };
  no_location_match: {
    alternativeLocation: string;
    alternativeArea: string;
    transportInfo?: string;
  };
  salary_inquiry: {
    baseSalary: number;
    levelSalary?: string;
  };
  schedule_inquiry: z.infer<typeof BaseReplyArgsSchema>;
  interview_request: {
    storeName?: string;
  };
  age_concern: {
    ageAppropriate: boolean;
    reason?: string;
  };
  insurance_inquiry: {
    hasInsurance: boolean;
    insuranceType?: string;
  };
  followup_chat: z.infer<typeof BaseReplyArgsSchema> & {
    alternativeOption: string;
    encouragement: string;
  };
  general_chat: z.infer<typeof BaseReplyArgsSchema> & {
    defaultMessage: string;
  };
  attendance_inquiry: z.infer<typeof BaseReplyArgsSchema>;
  flexibility_inquiry: z.infer<typeof BaseReplyArgsSchema>;
  attendance_policy_inquiry: z.infer<typeof BaseReplyArgsSchema>;
  work_hours_inquiry: z.infer<typeof BaseReplyArgsSchema>;
  availability_inquiry: z.infer<typeof BaseReplyArgsSchema>;
  part_time_support: z.infer<typeof BaseReplyArgsSchema>;
};

// 联合类型，用于 LLM 工具的参数
export type LLMToolArgs = ReplyArgsMap[keyof ReplyArgsMap];
