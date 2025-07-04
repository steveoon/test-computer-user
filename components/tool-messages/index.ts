import { 
  Camera, 
  ScrollText, 
  MessageCircle, 
  MessageSquare, 
  Briefcase, 
  Globe 
} from "lucide-react";
import { ComputerToolMessage } from "./computer-tool";
import { BashToolMessage } from "./bash-tool";
import { FeishuToolMessage } from "./feishu-tool";
import { WechatToolMessage } from "./wechat-tool";
import { JobPostingToolMessage } from "./job-posting-tool";
import { PuppeteerToolMessage } from "./puppeteer-tool";
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
};

// 导出类型
export * from "./types";