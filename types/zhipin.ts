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

export interface Templates {
  proactive: string[];
  inquiry: string[];
  location_match: string[];
  no_match: string[];
  interview: string[];
  followup: string[];
  salary_inquiry: string[];
  schedule_inquiry: string[];
}

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

// LLM 工具参数类型定义
export interface InitialInquiryReplyArgs {
  city: string;
  brand: string;
  workHours?: string;
  baseSalary?: number;
  levelSalary?: string;
}

export interface LocationInquiryReplyArgs {
  city: string;
  brand: string;
}

export interface LocationMatchReplyArgs {
  location: string;
  district: string;
  storeName: string;
  position: string;
  schedule: string;
}

export interface NoLocationMatchReplyArgs {
  alternativeLocation: string;
  alternativeArea: string;
  transportInfo?: string;
}

export interface SalaryInquiryReplyArgs {
  baseSalary: number;
  levelSalary?: string;
}

export interface InterviewRequestReplyArgs {
  storeName?: string;
}

export interface AgeConcernReplyArgs {
  ageAppropriate: boolean;
  reason?: string;
}

export interface InsuranceInquiryReplyArgs {
  hasInsurance: boolean;
  insuranceType?: string;
}

export interface FollowupChatReplyArgs {
  brand: string;
  alternativeOption: string;
  encouragement: string;
}

export interface GeneralChatReplyArgs {
  city: string;
  defaultMessage: string;
}

// 联合类型，用于 LLM 工具的参数
export type LLMToolArgs =
  | InitialInquiryReplyArgs
  | LocationInquiryReplyArgs
  | LocationMatchReplyArgs
  | NoLocationMatchReplyArgs
  | SalaryInquiryReplyArgs
  | InterviewRequestReplyArgs
  | AgeConcernReplyArgs
  | InsuranceInquiryReplyArgs
  | FollowupChatReplyArgs
  | GeneralChatReplyArgs;

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
