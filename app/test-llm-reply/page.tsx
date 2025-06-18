"use client";

import { useState } from "react";
import { BrandSelector } from "@/components/brand-selector";
import { useBrand } from "@/lib/contexts/brand-context";
import {
  clearBrandStorage,
  getBrandStorageStatus,
} from "@/lib/utils/brand-storage";
import { useModelConfig } from "@/lib/stores/model-config-store";
import { useConfigDataForChat } from "@/hooks/useConfigDataForChat";
import { Settings } from "lucide-react";
import Link from "next/link";

export default function TestLLMReplyPage() {
  const { currentBrand } = useBrand();
  const { classifyModel, replyModel, providerConfigs } = useModelConfig();
  const {
    configData,
    replyPrompts,
    isLoading: configLoading,
    error: configError,
  } = useConfigDataForChat();
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTestMessage, setCurrentTestMessage] = useState("");
  const [clickedButton, setClickedButton] = useState<number | null>(null);
  const [brandStats, setBrandStats] = useState<{
    historyCount: number;
    currentBrand: string | null;
  } | null>(null);

  // 🗑️ 清除品牌偏好
  const handleClearPreferences = async () => {
    try {
      await clearBrandStorage();
      alert("品牌偏好已清除！页面将刷新以重置状态。");
      window.location.reload();
    } catch (error) {
      alert("清除失败：" + error);
    }
  };

  // 📊 加载品牌统计信息
  const loadBrandStats = async () => {
    try {
      const stats = await getBrandStorageStatus();
      setBrandStats(stats);
    } catch (error) {
      console.warn("加载品牌统计失败:", error);
    }
  };

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
    
    // 🆕 新增：测试出勤要求和排班信息的问题
    "需要每天都上班吗？", // 测试出勤要求
    "一周要上几天班？", // 测试最少天数要求
    "可以换班吗？", // 测试排班灵活性
    "支持兼职吗？", // 测试兼职支持
    "需要周末上班吗？", // 测试周末要求
    "时间灵活吗？", // 测试时间灵活性
    "现在还有位置吗？", // 测试时间段可用性
    "最多可以迟到几分钟？", // 测试考勤政策
    "一周最少工作多少小时？", // 测试工时要求
    "排班方式是什么？", // 测试排班类型
  ];

  const handleSubmit = async (testMessage?: string) => {
    const messageToTest = testMessage || message;

    if (!messageToTest.trim()) {
      return;
    }

    // 🔧 检查配置数据是否加载完成
    if (configLoading) {
      setError("配置数据加载中，请稍候...");
      return;
    }

    if (configError) {
      setError(`配置数据加载失败: ${configError}`);
      return;
    }

    if (!configData || !replyPrompts) {
      setError("配置数据未加载，请刷新页面重试");
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
        body: JSON.stringify({
          message: messageToTest,
          brand: currentBrand,
          modelConfig: {
            classifyModel,
            replyModel,
            providerConfigs,
          },
          configData, // 🔧 传递配置数据
          replyPrompts, // 🔧 传递回复指令
        }),
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">LLM 智能回复测试</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">当前品牌：</span>
            <BrandSelector showHistory={true} />
          </div>
          <Link href="/agent-config">
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              <Settings className="w-4 h-4" />
              模型配置
            </button>
          </Link>
        </div>
      </div>

      {/* 当前模型配置显示 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">
          🤖 当前模型配置
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-700">分类模型：</span>
            <span className="text-blue-600">{classifyModel}</span>
          </div>
          <div>
            <span className="font-medium text-blue-700">回复模型：</span>
            <span className="text-blue-600">{replyModel}</span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          💡 点击右上角"模型配置"按钮可以修改使用的AI模型
        </p>
      </div>

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

      {/* 出勤和排班功能测试区域 */}
      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded">
        <h3 className="text-lg font-semibold text-emerald-800 mb-2">
          🆕 出勤要求和排班信息测试
        </h3>
        <p className="text-sm text-emerald-700 mb-3">
          测试新增的AttendanceRequirement、TimeSlotAvailability和SchedulingFlexibility功能：
          现在智能回复会包含详细的出勤要求、排班类型、时间段可用性等信息
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => handleSubmit("需要每天都上班吗？")}
            disabled={loading}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            出勤要求测试
          </button>
          <button
            onClick={() => handleSubmit("可以换班吗？")}
            disabled={loading}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            排班灵活性测试
          </button>
          <button
            onClick={() => handleSubmit("现在还有位置吗？")}
            disabled={loading}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            时间段可用性测试
          </button>
          <button
            onClick={() => handleSubmit("支持兼职吗？")}
            disabled={loading}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            兼职支持测试
          </button>
          <button
            onClick={() => handleSubmit("一周要上几天班？")}
            disabled={loading}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            最少天数测试
          </button>
          <button
            onClick={() => handleSubmit("排班方式是什么？")}
            disabled={loading}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            排班类型测试
          </button>
          <button
            onClick={() => handleSubmit("最多可以迟到几分钟？")}
            disabled={loading}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            考勤政策测试
          </button>
          <button
            onClick={() => handleSubmit("一周最少工作多少小时？")}
            disabled={loading}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            工时要求测试
          </button>
        </div>
      </div>

      {/* 分类功能测试区域 */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          🔬 分类功能测试
        </h3>
        <p className="text-sm text-yellow-700 mb-3">
          测试新的分类提取功能：现在降级时也会使用智能分类而不是硬编码
          "initial_inquiry"
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit("我想找服务员工作")}
            disabled={loading}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
          >
            初次咨询测试
          </button>
          <button
            onClick={() => handleSubmit("工资多少钱")}
            disabled={loading}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
          >
            薪资咨询测试
          </button>
          <button
            onClick={() => handleSubmit("徐汇区有吗")}
            disabled={loading}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
          >
            位置咨询测试
          </button>
          <button
            onClick={() => handleSubmit("我30岁可以吗")}
            disabled={loading}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
          >
            年龄咨询测试
          </button>
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

      {/* 配置加载状态 */}
      {configLoading && (
        <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            正在加载配置数据...
          </div>
        </div>
      )}

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
              <br />
              使用品牌：
              <span className="font-medium text-blue-600">{currentBrand}</span>
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
          <li>• 支持多品牌识别：成都你六姐、大米先生等</li>
          <li>• 回复内容会根据现有门店数据动态生成</li>
          <li>• 🆕 新增：回复现在包含详细的出勤要求、排班信息、时间段可用性</li>
          <li>• 🆕 新增：智能识别考勤政策、排班灵活性、工时要求等信息</li>
          <li>• 如果 LLM 调用失败，会自动降级到原有的规则引擎</li>
          <li>• 🎯 使用右上角品牌选择器切换不同品牌进行测试</li>
          <li>• ⚙️ 使用"模型配置"按钮可以自定义分类和回复模型</li>
          <li>• 🧪 使用绿色按钮测试新的出勤和排班功能</li>
        </ul>
      </div>

      {/* 最新配置功能说明 */}
      <div className="mt-4 p-4 bg-purple-50 rounded">
        <h3 className="font-semibold text-purple-800 mb-2">
          🆕 模型配置功能 (2024.12.22)：
        </h3>
        <div className="text-purple-700 text-sm space-y-2">
          <div>
            ✅ <strong>动态模型配置：</strong>{" "}
            支持在Agent配置页面动态切换分类和回复模型
          </div>
          <div>
            ✅ <strong>多Provider支持：</strong>{" "}
            支持Qwen、Google、Anthropic、OpenAI、OpenRouter等多个模型供应商
          </div>
          <div>
            ✅ <strong>实时生效：</strong>{" "}
            配置修改后立即应用到测试页面，无需重启应用
          </div>
          <div>
            ✅ <strong>baseURL配置：</strong> 支持自定义Provider的API端点URL
          </div>
          <div>
            📊 <strong>当前使用：</strong> 分类模型({classifyModel}) + 回复模型(
            {replyModel})
          </div>
        </div>
      </div>

      {/* 出勤和排班功能说明 */}
      <div className="mt-4 p-4 bg-emerald-50 rounded">
        <h3 className="font-semibold text-emerald-800 mb-2">
          🆕 出勤要求和排班信息功能 (2025.01.06)：
        </h3>
        <div className="text-emerald-700 text-sm space-y-2">
          <div>
            ✅ <strong>AttendanceRequirement：</strong>{" "}
            每个岗位现在包含详细的出勤要求（必须上岗日期、最少天数、描述）
          </div>
          <div>
            ✅ <strong>TimeSlotAvailability：</strong>{" "}
            时间段可用性信息（最大容量、当前预约、优先级）
          </div>
          <div>
            ✅ <strong>SchedulingFlexibility：</strong>{" "}
            排班灵活性选项（可否换班、兼职支持、周末要求）
          </div>
          <div>
            ✅ <strong>AttendancePolicy：</strong>{" "}
            考勤政策（准时要求、迟到容忍、考勤追踪严格程度）
          </div>
          <div>
            ✅ <strong>智能上下文：</strong>{" "}
            智能回复现在会根据这些信息生成更详细、准确的回复
          </div>
          <div>
            📊 <strong>测试验证：</strong> 使用上方绿色按钮测试各项功能是否正确展示在回复中
          </div>
        </div>
      </div>

      {/* 最新配置重构说明 */}
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">
          🆕 配置本地化重构 (2025.01.06)：
        </h3>
        <div className="text-blue-700 text-sm space-y-2">
          <div>
            ✅ <strong>配置数据本地化：</strong>{" "}
            所有配置数据（品牌数据、系统提示词、回复指令）现在存储在浏览器
            localforage 中
          </div>
          <div>
            ✅ <strong>动态配置传递：</strong> 客户端自动从 localforage
            加载配置并传递给服务端API
          </div>
          <div>
            ✅ <strong>品牌上下文重构：</strong>{" "}
            品牌选择器现在从配置服务动态加载品牌列表，不再依赖硬编码
          </div>
          <div>
            ✅ <strong>统一数据流：</strong> 浏览器(localforage) → 客户端Hook →
            API调用携带配置 → 服务端使用配置
          </div>
          <div>
            📊 <strong>实时生效：</strong> 配置修改后立即生效，无需重启应用
          </div>
        </div>
      </div>

      {/* 最新重构说明 */}
      <div className="mt-4 p-4 bg-green-50 rounded">
        <h3 className="font-semibold text-green-800 mb-2">
          🆕 最新重构亮点 (2024.06.06)：
        </h3>
        <div className="text-green-700 text-sm space-y-2">
          <div>
            ✅ <strong>分类功能独立化：</strong> 将 generateObject
            分类提取为独立的 classifyUserMessage 函数
          </div>
          <div>
            ✅ <strong>智能降级：</strong>{" "}
            即使LLM生成失败，降级时也能使用智能分类而不是硬编码
            "initial_inquiry"
          </div>
          <div>
            ✅ <strong>三层容错：</strong> LLM智能回复 → 智能分类+规则引擎 →
            通用错误信息
          </div>
          <div>
            ✅ <strong>类型安全：</strong> 新增 MessageClassification
            接口定义，提升代码质量
          </div>
          <div>
            📊 <strong>测试验证：</strong> "年龄有要求吗" → age_concern →
            "您的年龄没问题的"
          </div>
        </div>
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

      {/* 品牌切换测试说明 */}
      <div className="mt-4 p-4 bg-orange-50 rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-orange-800">
            🔄 品牌切换测试指南：
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={loadBrandStats}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              📊 查看统计
            </button>
            <button
              onClick={handleClearPreferences}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              🗑️ 清除偏好
            </button>
          </div>
        </div>

        {brandStats && (
          <div className="mb-3 p-2 bg-white rounded border text-xs">
            <strong>💾 存储状态：</strong>
            当前品牌：
            <span className="text-blue-600">
              {brandStats.currentBrand || "默认"}
            </span>{" "}
            | 历史记录：
            <span className="text-green-600">{brandStats.historyCount}条</span>
          </div>
        )}

        <div className="text-orange-700 text-sm space-y-2">
          <div>
            1️⃣ <strong>切换品牌：</strong>{" "}
            使用右上角的品牌选择器切换到不同品牌（如：成都你六姐 ↔ 海底捞）
          </div>
          <div>
            2️⃣ <strong>测试场景：</strong>{" "}
            发送相同的消息，观察不同品牌下回复内容的差异
          </div>
          <div>
            3️⃣ <strong>重点验证：</strong>{" "}
            门店位置、职位信息、薪资标准是否正确匹配到选中品牌
          </div>
          <div>
            4️⃣ <strong>建议测试：</strong> "五角场附近有工作吗？" -
            在不同品牌下查看门店匹配结果
          </div>
          <div>
            💾 <strong>持久化：</strong>{" "}
            您的品牌选择会自动保存，下次打开页面时会记住您的偏好
          </div>
          <div>
            ⚠️ <strong>注意：</strong>{" "}
            品牌切换后的效果会立即应用到下一次测试请求中
          </div>
        </div>
      </div>
    </div>
  );
}
