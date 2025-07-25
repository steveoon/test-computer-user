# Duliday 面试预约工具集

这个目录包含了与 Duliday API 集成的三个核心工具，用于处理职位查询和面试预约功能。

## 工具概览

### 1. duliday-job-list-tool
获取品牌的在招岗位列表，支持多种过滤条件。

### 2. duliday-job-details-tool
获取特定岗位的详细信息，包括面试时间安排。

### 3. duliday-interview-booking-tool
为求职者预约面试。

## 使用流程

### 典型的面试预约流程：

1. **查询岗位列表** → 获取 jobId 和 jobBasicInfoId
2. **（可选）查询岗位详情** → 获取更多面试安排信息
3. **预约面试** → 使用 jobId 完成预约

## 工具使用示例

### 场景 1：用户查询特定品牌的所有岗位
```
用户：帮我看看奥乐齐有哪些在招岗位
LLM：使用 duliday_job_list 工具，参数：{ brandName: "奥乐齐" }
```

### 场景 2：用户查询特定条件的岗位
```
用户：我想找肯德基在浦东新区的兼职岗位
LLM：使用 duliday_job_list 工具，参数：{ 
  brandName: "肯德基",
  regionName: "浦东新区",
  laborForm: "兼职"
}
```

### 场景 3：用户预约面试
```
用户：姓名：李青，电话：13585516989，性别：男，年龄：39，
     想应聘奥乐齐世茂店的岗位，面试时间：2025年7月22日下午13点

LLM步骤：
1. 使用 duliday_job_list 工具查找奥乐齐世茂店的岗位
   参数：{ brandName: "奥乐齐", storeName: "世茂" }
   
2. 从返回结果中获取 jobId（如：520422）

3. 使用 duliday_interview_booking 工具预约面试
   参数：{
     name: "李青",
     phone: "13585516989",
     genderId: 1,
     age: "39",
     education: "大专",
     jobId: 520422,
     interviewTime: "2025-07-22 13:00:00"
   }
```

### 场景 4：信息不完整的处理
```
用户：帮我预约肯德基的面试，我叫张三，电话13800138000

LLM：发现缺少必要信息，回复用户：
"我需要以下信息才能为您预约面试：
- 性别
- 年龄
- 想应聘的具体门店或地区
- 期望的面试时间
- 工作类型（全职/兼职）

请提供这些信息。"
```

## 配置要求

### 环境变量
- `DULIDAY_TOKEN`: Duliday API 访问令牌（必需）

### 客户端 localStorage
- `duliday_token`: 用户自定义的 token（可选，优先使用）

## 支持的品牌

当前系统支持以下品牌的岗位查询和面试预约：
- 肯德基
- 成都你六姐
- 大米先生
- 天津肯德基
- 上海必胜客
- 奥乐齐

如需添加新品牌，请在 `lib/constants/organization-mapping.ts` 中更新 `ORGANIZATION_MAPPING`。

## 错误处理

### 常见错误及解决方案：

1. **缺少 Token**
   - 错误：缺少DULIDAY_TOKEN
   - 解决：在设置中配置 token 或设置环境变量

2. **品牌未找到**
   - 错误：未找到品牌"XXX"的组织ID映射
   - 解决：使用支持的品牌名称，或联系管理员添加新品牌映射

3. **重复报名**
   - 错误：您已为用户报名该岗位
   - 解决：告知用户已经报名成功，无需重复操作

4. **信息不完整**
   - 错误：缺少必填信息：姓名、联系电话等
   - 解决：询问用户并收集完整信息后重试

## 注意事项

1. 面试时间格式必须是：`YYYY-MM-DD HH:mm:ss`
2. 性别ID：1=男，2=女
3. 年龄必须以字符串形式传递
4. 学历支持的类型：初中以下、初中、高中、中专/技校/职高、高职、大专、本科、硕士（默认为大专）
5. 工具会优先使用客户端传递的 token，其次使用环境变量
6. 查询结果会包含必要的 ID 信息供后续工具使用