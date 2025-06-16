// Boss直聘相关数据类型定义

export interface Position {
  id: string;
  name: string;
  timeSlots: string[];
  baseSalary: number;
  levelSalary: string;
  workHours: string;
  benefits: string;
  requirements: string[];
  urgent: boolean;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  district: string;
  subarea: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  transportation: string;
  positions: Position[];
  brand: string; // 新增：门店所属品牌
}

// 使用映射类型使 Templates 更灵活
export type Templates = Partial<Record<ReplyContext | 'proactive' | 'inquiry' | 'no_match' | 'interview' | 'followup', string[]>>;

export interface ScreeningRules {
  age: {
    min: number;
    max: number;
    preferred: number[];
  };
  blacklistKeywords: string[];
  preferredKeywords: string[];
}

// 品牌特定配置
export interface BrandConfig {
  templates: Templates;
  screening: ScreeningRules;
}

export interface ZhipinData {
  city: string;
  stores: Store[];
  brands: Record<string, BrandConfig>; // 新增：品牌配置映射
  // 保持向后兼容的默认配置
  defaultBrand?: string;
  templates?: Templates; // 可选：作为默认模板
  screening?: ScreeningRules; // 可选：作为默认筛选规则
}

export interface SampleData {
  zhipin: ZhipinData;
}

export type ReplyContext =
  | "initial_inquiry"
  | "location_inquiry"
  | "location_match"
  | "no_location_match"
  | "schedule_inquiry"
  | "interview_request"
  | "general_chat"
  | "salary_inquiry"
  | "age_concern"
  | "insurance_inquiry"
  | "followup_chat";

export interface CandidateInfo {
  name?: string;
  age?: number;
  location?: string;
  experience?: string;
  availability?: string;
}

export interface ConversationMessage {
  role: "candidate" | "recruiter";
  message: string;
  timestamp?: string;
}

// LLM 工具参数基础类型
export interface BaseReplyArgs {
  city?: string;
  brand?: string;
}

// 使用类型映射定义每个场景的参数类型
export type ReplyArgsMap = {
  initial_inquiry: BaseReplyArgs & {
    workHours?: string;
    baseSalary?: number;
    levelSalary?: string;
  };
  location_inquiry: BaseReplyArgs;
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
  schedule_inquiry: BaseReplyArgs; // 如果需要特定字段，可以添加
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
  followup_chat: BaseReplyArgs & {
    alternativeOption: string;
    encouragement: string;
  };
  general_chat: BaseReplyArgs & {
    defaultMessage: string;
  };
};

// 保持向后兼容的类型别名
export type InitialInquiryReplyArgs = ReplyArgsMap['initial_inquiry'];
export type LocationInquiryReplyArgs = ReplyArgsMap['location_inquiry'];
export type LocationMatchReplyArgs = ReplyArgsMap['location_match'];
export type NoLocationMatchReplyArgs = ReplyArgsMap['no_location_match'];
export type SalaryInquiryReplyArgs = ReplyArgsMap['salary_inquiry'];
export type ScheduleInquiryReplyArgs = ReplyArgsMap['schedule_inquiry'];
export type InterviewRequestReplyArgs = ReplyArgsMap['interview_request'];
export type AgeConcernReplyArgs = ReplyArgsMap['age_concern'];
export type InsuranceInquiryReplyArgs = ReplyArgsMap['insurance_inquiry'];
export type FollowupChatReplyArgs = ReplyArgsMap['followup_chat'];
export type GeneralChatReplyArgs = ReplyArgsMap['general_chat'];

// 联合类型，用于 LLM 工具的参数
export type LLMToolArgs = ReplyArgsMap[keyof ReplyArgsMap];

// 新增：消息分类结果类型（统一到types中）
export interface MessageClassification {
  replyType: ReplyContext; // 复用ReplyContext类型
  extractedInfo: {
    mentionedBrand?: string | null;
    city?: string | null;
    mentionedLocations?: Array<{
      location: string;
      confidence: number;
    }> | null;
    mentionedDistrict?: string | null;
    specificAge?: number | null;
    hasUrgency?: boolean | null;
    preferredSchedule?: string | null;
  };
  reasoning: string;
}
