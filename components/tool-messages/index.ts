import { 
  Camera, 
  ScrollText, 
  MessageCircle, 
  MessageSquare, 
  Briefcase, 
  Globe,
  Bot,
  Users,
  Smartphone,
  UserCheck,
  Building2,
  FileText,
  Calendar
} from "lucide-react";
import { ComputerToolMessage } from "./computer-tool";
import { BashToolMessage } from "./bash-tool";
import { FeishuToolMessage } from "./feishu-tool";
import { WechatToolMessage } from "./wechat-tool";
import { JobPostingToolMessage } from "./job-posting-tool";
import { PuppeteerToolMessage } from "./puppeteer-tool";
import { ZhipinReplyToolMessage } from "./zhipin-reply-tool";
import { ZhipinToolMessage } from "./zhipin-tool";
import { ZhipinSendMessageTool } from "./zhipin-send-message-tool";
import { ZhipinChatDetailsTool } from "./zhipin-chat-details-tool";
import { ZhipinExchangeWechatTool } from "./zhipin-exchange-wechat-tool";
import { ZhipinGetUsernameTool } from "./zhipin-get-username-tool";
import { DulidayJobListToolMessage } from "./duliday-job-list-tool";
import { DulidayJobDetailsToolMessage } from "./duliday-job-details-tool";
import { DulidayInterviewBookingToolMessage } from "./duliday-interview-booking-tool";
import { themes, type ToolConfig } from "./types";

// 工具注册表
export const toolRegistry: Record<string, ToolConfig> = {
  computer: {
    icon: Camera,
    defaultTheme: themes.zinc,
    render: ComputerToolMessage,
  },
  bash: {
    icon: ScrollText,
    defaultTheme: themes.zinc,
    render: BashToolMessage,
  },
  feishu: {
    icon: MessageCircle,
    defaultTheme: themes.blue,
    render: FeishuToolMessage,
  },
  wechat: {
    icon: MessageSquare,
    defaultTheme: themes.green,
    render: WechatToolMessage,
  },
  job_posting_generator: {
    icon: Briefcase,
    defaultTheme: themes.indigo,
    render: JobPostingToolMessage,
  },
  puppeteer: {
    icon: Globe,
    defaultTheme: themes.purple,
    render: PuppeteerToolMessage,
  },
  zhipin_reply_generator: {
    icon: Bot,
    defaultTheme: themes.yellow,
    render: ZhipinReplyToolMessage,
  },
  // Zhipin automation tools
  zhipin_get_unread_candidates_improved: {
    icon: Users,
    defaultTheme: themes.blue,
    render: ZhipinToolMessage,
  },
  zhipin_open_candidate_chat_improved: {
    icon: Users,
    defaultTheme: themes.blue,
    render: ZhipinToolMessage,
  },
  zhipin_send_message: {
    icon: MessageSquare,
    defaultTheme: themes.blue,
    render: ZhipinSendMessageTool,
  },
  zhipin_get_chat_details: {
    icon: ScrollText,
    defaultTheme: themes.blue,
    render: ZhipinChatDetailsTool,
  },
  zhipin_exchange_wechat: {
    icon: Smartphone,
    defaultTheme: themes.green,
    render: ZhipinExchangeWechatTool,
  },
  zhipin_get_username: {
    icon: UserCheck,
    defaultTheme: themes.green,
    render: ZhipinGetUsernameTool,
  },
  // Duliday interview booking tools
  duliday_job_list: {
    icon: Building2,
    defaultTheme: themes.blue,
    render: DulidayJobListToolMessage,
  },
  duliday_job_details: {
    icon: FileText,
    defaultTheme: themes.purple,
    render: DulidayJobDetailsToolMessage,
  },
  duliday_interview_booking: {
    icon: Calendar,
    defaultTheme: themes.green,
    render: DulidayInterviewBookingToolMessage,
  },
};

// 导出类型
export * from "./types";