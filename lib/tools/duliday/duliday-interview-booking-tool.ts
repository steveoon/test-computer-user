import { tool } from "ai";
import { z } from "zod";
import { getEducationIdByName, EDUCATION_MAPPING } from "@/lib/constants/organization-mapping";

/**
 * Duliday预约面试工具
 *
 * @description 为求职者预约面试，需要提供完整的个人信息和岗位信息
 * @param customToken 自定义的Duliday token，优先使用此token
 * @returns AI SDK tool instance
 */
export const dulidayInterviewBookingTool = (customToken?: string) =>
  tool({
    description:
      "预约面试。为求职者预约指定岗位的面试，需要提供完整的个人信息包括姓名、电话、性别、年龄、岗位ID和面试时间。",
    parameters: z.object({
      name: z.string().describe("求职者姓名"),
      phone: z.string().describe("联系电话"),
      age: z.string().describe("年龄，以字符串形式提供"),
      genderId: z.number().describe("性别ID：1=男，2=女"),
      jobId: z.number().describe("岗位ID，从岗位列表或岗位详情中获取"),
      interviewTime: z
        .string()
        .describe("面试时间，格式：YYYY-MM-DD HH:mm:ss，例如：2025-07-22 13:00:00"),
      education: z
        .string()
        .optional()
        .default("大专")
        .describe("学历，如：初中、高中、大专、本科等。默认为大专"),
      hasHealthCertificate: z
        .number()
        .optional()
        .default(1)
        .describe("是否有健康证：1=有，2=无但接受办理健康证，3=无且不接受办理健康证，默认为1"),
      customerLabelList: z
        .array(z.any())
        .optional()
        .default([])
        .describe("客户标签列表，默认为空数组"),
      operateType: z.number().optional().default(3).describe("操作类型，默认为3"),
    }),
    execute: async ({
      name,
      phone,
      age,
      genderId,
      jobId,
      interviewTime,
      education = "大专",
      hasHealthCertificate = 1,
      customerLabelList = [],
      operateType = 3,
    }) => {
      console.log("🔍 duliday_interview_booking tool called with:", { 
        name, phone, age, genderId, jobId, interviewTime, education, hasHealthCertificate 
      });
      try {
        // 优先使用自定义token，否则使用环境变量
        const dulidayToken = customToken || process.env.DULIDAY_TOKEN;
        if (!dulidayToken) {
          return {
            type: "text" as const,
            text: "❌ 缺少DULIDAY_TOKEN，请在设置中配置或设置环境变量",
          };
        }

        // 验证必填字段
        const missingFields: string[] = [];
        if (!name) missingFields.push("姓名");
        if (!phone) missingFields.push("联系电话");
        if (!age) missingFields.push("年龄");
        if (!genderId) missingFields.push("性别");
        if (!jobId) missingFields.push("岗位ID");
        if (!interviewTime) missingFields.push("面试时间");

        if (missingFields.length > 0) {
          return {
            type: "text" as const,
            text: `❌ 缺少必填信息：${missingFields.join("、")}\n\n请提供完整的求职者信息。`,
          };
        }

        // 验证面试时间格式
        const timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!timeRegex.test(interviewTime)) {
          return {
            type: "text" as const,
            text: `❌ 面试时间格式错误\n\n请使用正确的格式：YYYY-MM-DD HH:mm:ss\n例如：2025-07-22 13:00:00`,
          };
        }

        // 转换学历名称为ID
        const educationId = getEducationIdByName(education);
        if (!educationId) {
          const availableEducations = Object.values(EDUCATION_MAPPING).join("、");
          return {
            type: "text" as const,
            text: `❌ 无效的学历：${education}\n\n支持的学历类型：${availableEducations}\n\n请提供正确的学历信息。`,
          };
        }

        // 构建请求体
        const requestBody = {
          name,
          age,
          phone,
          genderId,
          educationId,
          hasHealthCertificate,
          interviewTime,
          customerLabelList,
          jobId,
          operateType,
        };

        // 调用API
        const response = await fetch("https://k8s.duliday.com/persistence/a/supplier/entryUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "duliday-token": dulidayToken,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // 处理响应
        if (data.code === 0) {
          // 成功
          let successMessage = `✅ 面试预约成功！\n\n`;
          successMessage += `👤 求职者：${name}\n`;
          successMessage += `📞 联系方式：${phone}\n`;
          successMessage += `🎓 学历：${education}\n`;
          successMessage += `⏰ 面试时间：${interviewTime}\n`;
          successMessage += `📋 岗位ID：${jobId}\n`;

          if (data.data?.notice) {
            successMessage += `\n📢 ${data.data.notice}`;
          }

          return {
            type: "text" as const,
            text: successMessage,
          };
        } else {
          // 失败 - 处理各种错误码
          let errorMessage = `❌ 预约失败：${data.message}\n\n`;

          // 根据错误码提供具体建议
          switch (data.code) {
            case 30003:
              errorMessage += "该求职者已经报名过此岗位，无需重复报名。";
              break;
            case 10000:
              if (data.message.includes("姓名")) {
                errorMessage += "请提供求职者的姓名。";
              } else if (data.message.includes("联系电话")) {
                errorMessage += "请提供求职者的联系电话。";
              } else if (data.message.includes("岗位")) {
                if (data.message.includes("不存在")) {
                  errorMessage += "岗位不存在或已下架，请重新选择其他岗位。";
                } else {
                  errorMessage += "请提供有效的岗位ID。";
                }
              }
              break;
            case 50000:
              errorMessage += "服务器错误，可能是数据格式问题。请检查：\n";
              errorMessage += "- 性别ID必须是数字（1=男，2=女）\n";
              errorMessage += "- 面试时间格式必须是：YYYY-MM-DD HH:mm:ss";
              break;
            default:
              errorMessage += "请检查输入信息是否完整正确。";
          }

          return {
            type: "text" as const,
            text: errorMessage,
          };
        }
      } catch (error) {
        console.error("预约面试失败:", error);
        return {
          type: "text" as const,
          text: `❌ 预约面试失败: ${error instanceof Error ? error.message : "未知错误"}`,
        };
      }
    },
  });
