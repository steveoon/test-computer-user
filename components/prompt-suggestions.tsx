import { ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";

const suggestions = [
  {
    text: "发送前厅岗位空缺通知",
    prompt: "生成前厅岗位空缺的通知消息，并用Wechat发送",
  },
  {
    text: "测试中文逐字符编码输入",
    prompt:
      "测试中文逐字符Unicode编码输入功能：输入一段中文文本 '您好，这是Unicode编码测试。我正在寻找工作机会，希望能够了解贵公司的职位详情。谢谢！' 来验证逐字符Unicode编码输入是否正常工作，系统会使用Ctrl+Shift+U快捷键逐个输入Unicode字符。",
  },
  {
    text: "打开Boss直聘并登录",
    prompt: `先打开浏览器并访问"https://www.zhipin.com/web/user/"
    1) 点击"APP扫码登录"；
    2) 等待用户扫码成功；
    3) 截图查看登录状态；
    4) 如果登录成功，点击"消息"按钮；
    5) 截图查看消息页面状态；
    6) 如果消息页面打开成功，返回消息页面打开成功信息；
    7) 如果消息页面打开失败，让我手动操作。
    `,
  },
  {
    text: "处理直聘未读消息",
    prompt:
      "我正在BOSS直聘的消息页面，请开始处理未读消息。分析页面，找到未读对话并开始按流程沟通。",
  },
  // {
  //   text: "Check system memory usage",
  //   prompt: "Run the top command to show system resource usage",
  // },
  {
    text: "安装中文字体",
    prompt: "安装少数可用的中文字体，确认按照好即可结束，无需执行其他验证",
  },
  // {
  //   text: "What do you see",
  //   prompt:
  //     "Capture a screenshot of the current screen and tell me what you see",
  // },
];

export const PromptSuggestions = ({
  submitPrompt,
  disabled,
}: {
  submitPrompt: (prompt: string) => void;
  disabled: boolean;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white border-t border-zinc-200">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="pill"
          size="pill"
          onClick={() => submitPrompt(suggestion.prompt)}
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
