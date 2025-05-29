import { ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";

const suggestions = [
  {
    text: "配置中文输入环境",
    prompt:
      "执行 setup_chinese_input 操作来配置完整的中文输入环境，包括字体、输入法和编码设置",
  },
  {
    text: "测试中文逐字符编码输入",
    prompt:
      "测试中文逐字符Unicode编码输入功能：输入一段中文文本 '您好，这是Unicode编码测试。我正在寻找工作机会，希望能够了解贵公司的职位详情。谢谢！' 来验证逐字符Unicode编码输入是否正常工作，系统会使用Ctrl+Shift+U快捷键逐个输入Unicode字符。",
  },
  {
    text: "打开Boss直聘并登录",
    prompt: `先打开浏览器并访问"https://www.zhipin.com/web/user/"
    1) 点击“APP扫码登录”；
    2) 等待用户扫码成功；
    3) 截图查看登录状态；
    4) 如果登录成功，点击"消息"按钮；
    5) 截图查看消息页面状态；
    6) 如果消息页面打开成功，返回消息页面打开成功信息；
    7) 如果消息页面打开失败，让我手动操作。
    `,
  },
  {
    text: "与BOSS直聘页面中的招聘者沟通",
    prompt: `我正在BOSS直聘页面上。请帮我处理未读消息：
      1) 先截图查看当前页面状态；
      2) 在左侧聊天列表中找到有红色圆点未读消息提示的联系人，点击该联系人的头像；
      3) 再次截图查看聊天内容，仔细阅读对方最新的消息；
      4) 根据对方消息内容智能回复：如果是打招呼就礼貌回应，如果询问简历就说明简历发送方式，如果咨询工作经验就简要介绍相关背景，如果是职位介绍就表示感兴趣并询问具体信息；回复内容尽量言简意赅（不要超过30个字）；
      5) 输入合适的中文回复（点击或切换联系人时会自动focus到输入框，请直接输入回复）；
      6) 发送消息（使用回车键）。
      请保持回复专业、礼貌且针对性强。
      `,
  },
  // {
  //   text: "Check system memory usage",
  //   prompt: "Run the top command to show system resource usage",
  // },
  {
    text: "安装中文字体",
    prompt: "安装少数可用的中文字体",
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
            <span className="text-black text-sm">
              {suggestion.text.toLowerCase()}
            </span>
          </span>
          <ArrowUpRight className="ml-1 h-2 w-2 sm:h-3 sm:w-3 text-zinc-500 group-hover:opacity-70" />
        </Button>
      ))}
    </div>
  );
};
