import { ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";

export interface PromptSuggestion {
  text: string;
  prompt: string;
  editable?: boolean;
  editableFields?: Array<{
    key: string;
    pattern: RegExp;
    defaultValue?: string;
  }>;
}

const suggestions: PromptSuggestion[] = [
  {
    text: "发送前厅岗位空缺通知",
    prompt: "生成前厅岗位空缺的通知消息，并用Wechat发送",
    editable: true,
    editableFields: [
      {
        key: "岗位",
        pattern: /前厅/g,
        defaultValue: "前厅",
      },
    ],
  },
  {
    text: "测试中文逐字符编码输入",
    prompt:
      "测试中文逐字符Unicode编码输入功能：输入一段中文文本 '您好，这是Unicode编码测试。我正在寻找工作机会，希望能够了解贵公司的职位详情。谢谢！' 来验证逐字符Unicode编码输入是否正常工作，系统会使用Ctrl+Shift+U快捷键逐个输入Unicode字符。",
    editable: false,
  },
  {
    text: "预约面试",
    prompt: `帮我为求职者预约面试，以下是信息：
    姓名：李青，电话：13585516989，性别：男，年龄：39，
    想应聘奥乐齐世茂店的岗位，面试时间：2025年7月22日下午13点`,
    editable: true,
    editableFields: [
      { key: "姓名", pattern: /姓名：([^，\n]+)/g },
      { key: "电话", pattern: /电话：(\d+)/g },
      { key: "性别", pattern: /性别：([男女])/g },
      { key: "年龄", pattern: /年龄：(\d+)/g },
      { key: "门店", pattern: /奥乐齐世茂店/g, defaultValue: "奥乐齐世茂店" },
      { key: "面试时间", pattern: /面试时间：([^，\n]+)/g },
    ],
  },
  {
    text: "处理直聘未读消息",
    prompt:
      "我正在BOSS直聘的消息页面，请开始处理未读消息。分析页面，找到未读对话并开始按流程沟通。",
    editable: false,
  },
  {
    text: "发送岗位通知到飞书",
    prompt: "生成后厨岗位空缺的通知消息，门店是静安大悦城店，需要3人，并发送到飞书群",
    editable: true,
    editableFields: [
      { key: "岗位", pattern: /后厨/g, defaultValue: "后厨" },
      { key: "门店", pattern: /静安大悦城店/g, defaultValue: "静安大悦城店" },
      { key: "人数", pattern: /需要(\d+)人/g },
      { key: "平台", pattern: /飞书/g, defaultValue: "飞书" },
    ],
  },
];

export const PromptSuggestions = ({
  submitPrompt,
  disabled,
}: {
  submitPrompt: (suggestion: PromptSuggestion) => void;
  disabled: boolean;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white border-t border-zinc-200">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="pill"
          size="pill"
          onClick={() => submitPrompt(suggestion)}
          disabled={disabled}
        >
          <span>
            <span className="text-black text-sm">{suggestion.text.toLowerCase()}</span>
          </span>
          <ArrowUpRight className="ml-1 h-2 w-2 sm:h-3 sm:w-3 text-zinc-500 group-hover:opacity-70" />
        </Button>
      ))}
    </div>
  );
};
