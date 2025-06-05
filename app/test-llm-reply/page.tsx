"use client";

import { useState } from "react";

export default function TestLLMReplyPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTestMessage, setCurrentTestMessage] = useState("");
  const [clickedButton, setClickedButton] = useState<number | null>(null);

  const testPresetMessages = [
    "你好，我想找兼职工作",
    "杨浦区有工作吗？",
    "薪资是多少？",
    "我45岁了，可以做吗？",
    "有保险吗？",
    "什么时候可以面试？",
    "五角场附近有门店吗？",
    "海底捞有工作机会吗？", // 新增：测试海底捞品牌识别
    "人民广场那边有海底捞招聘吗？", // 新增：测试品牌+位置匹配
    "大米先生有招聘吗？", // 演示：测试动态品牌识别（不存在的品牌）
  ];

  const handleSubmit = async (testMessage?: string) => {
    const messageToTest = testMessage || message;

    if (!messageToTest.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setReply("");
    setCurrentTestMessage(messageToTest);

    try {
      const response = await fetch("/api/test-llm-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToTest }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReply(data.reply);
    } catch (error) {
      console.error("测试失败:", error);
      setError(error instanceof Error ? error.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">LLM 智能回复测试</h1>

      {/* 预设消息快速测试 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">预设测试消息：</h2>
        <p className="text-sm text-gray-600 mb-3">点击下方任意按钮开始测试</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {testPresetMessages.map((msg, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setClickedButton(index);
                setTimeout(() => setClickedButton(null), 200);
                handleSubmit(msg);
              }}
              disabled={loading}
              className={`p-2 text-left border rounded hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 ${
                clickedButton === index ? "bg-blue-200" : ""
              } active:bg-blue-100`}
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* 自定义消息测试 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">自定义测试消息：</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入候选人消息..."
            className="flex-1 p-2 border rounded"
            disabled={loading}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "生成中..." : "测试"}
          </button>
        </div>
      </div>

      {/* 结果显示 */}
      {loading && (
        <div className="p-4 bg-gray-100 rounded">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            正在生成智能回复...
          </div>
          {currentTestMessage && (
            <div className="mt-2 text-sm text-gray-600">
              测试消息：
              <span className="font-medium">"{currentTestMessage}"</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          <strong>错误：</strong> {error}
        </div>
      )}

      {reply && !loading && (
        <div className="p-4 bg-green-100 border border-green-400 rounded">
          <h3 className="font-semibold text-green-800 mb-2">
            LLM 生成的回复：
          </h3>
          <p className="text-green-700">{reply}</p>
        </div>
      )}

      {/* 说明信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">测试说明：</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• 此测试页面用于验证基于 AI SDK 的智能回复生成功能</li>
          <li>• 系统会根据候选人消息智能选择合适的回复模板</li>
          <li>• 支持多品牌识别：成都你六姐、海底捞等</li>
          <li>• 回复内容会根据现有门店数据动态生成</li>
          <li>• 如果 LLM 调用失败，会自动降级到原有的规则引擎</li>
        </ul>
      </div>

      {/* 多品牌支持说明 */}
      <div className="mt-4 p-4 bg-green-50 rounded">
        <h3 className="font-semibold text-green-800 mb-2">多品牌支持确认：</h3>
        <div className="text-green-700 text-sm space-y-2">
          <div>
            ✅ <strong>数据结构兼容性：</strong>{" "}
            新的schema完全兼容现有的loadZhipinData()函数
          </div>
          <div>
            ✅ <strong>动态品牌识别：</strong>{" "}
            LLM自动识别数据中的任何品牌，无需硬编码品牌名称
          </div>
          <div>
            ✅ <strong>reply_context分类：</strong> 支持所有现有的回复上下文分类
          </div>
          <div>
            📊 <strong>当前数据：</strong> 成都你六姐（3家门店）+
            海底捞（2家门店）
          </div>
        </div>
      </div>

      {/* 动态品牌设计说明 */}
      <div className="mt-4 p-4 bg-purple-50 rounded">
        <h3 className="font-semibold text-purple-800 mb-2">
          🚀 智能品牌适配设计：
        </h3>
        <div className="text-purple-700 text-sm space-y-2">
          <div>
            🎯 <strong>自动品牌发现：</strong>{" "}
            系统自动从数据中提取所有品牌，生成动态的识别关键词列表
          </div>
          <div>
            🔄 <strong>零代码品牌切换：</strong>{" "}
            当业务品牌调整（如添加"大米先生"），只需更新数据文件，无需修改代码
          </div>
          <div>
            📝 <strong>智能提示词：</strong>{" "}
            LLM提示词动态适应任何品牌组合，保证回复的准确性和一致性
          </div>
          <div>
            💡 <strong>测试验证：</strong>{" "}
            尝试"大米先生有招聘吗？"测试不存在品牌的处理逻辑
          </div>
        </div>
      </div>
    </div>
  );
}
