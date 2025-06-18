# Attendance & Schedule Enhancement Summary

## Overview

Enhanced the ZhipinData structure with comprehensive attendance and schedule management capabilities while maintaining backward compatibility with the existing recruitment system. **All type definitions have been migrated from TypeScript interfaces to Zod schemas for enhanced runtime validation and type safety.**

## Type Definition Architecture

### Zod Schema-First Approach

All types are now defined as Zod schemas first, then TypeScript types are generated using `z.infer<typeof Schema>`:

```typescript
// Schema Definition
export const ScheduleTypeSchema = z.enum([
  "fixed",
  "flexible",
  "rotating",
  "on_call",
]);

// Generated TypeScript Type
export type ScheduleType = z.infer<typeof ScheduleTypeSchema>;
```

## New Type Definitions

### 1. Schedule Type (`ScheduleType`)

```typescript
// Zod Schema
export const ScheduleTypeSchema = z.enum([
  "fixed", // 固定排班
  "flexible", // 灵活排班
  "rotating", // 轮班制
  "on_call", // 随叫随到
]);

export type ScheduleType = z.infer<typeof ScheduleTypeSchema>;
```

### 2. Attendance Policy (`AttendancePolicy`)

```typescript
// Zod Schema
export const AttendancePolicySchema = z.object({
  punctualityRequired: z.boolean(), // 是否要求准时
  lateToleranceMinutes: z.number().min(0), // 迟到容忍分钟数
  attendanceTracking: z.enum(["strict", "flexible", "none"]), // 考勤追踪严格程度
  makeupShiftsAllowed: z.boolean(), // 是否允许补班
});

export type AttendancePolicy = z.infer<typeof AttendancePolicySchema>;
```

### 3. Time Slot Availability (`TimeSlotAvailability`)

```typescript
// Zod Schema
export const TimeSlotAvailabilitySchema = z.object({
  slot: z.string(), // 时间段 (如 "11:30~14:00")
  maxCapacity: z.number().min(0), // 最大容纳人数
  currentBooked: z.number().min(0), // 当前已预约人数
  isAvailable: z.boolean(), // 是否可用
  priority: z.enum(["high", "medium", "low"]), // 优先级
});

export type TimeSlotAvailability = z.infer<typeof TimeSlotAvailabilitySchema>;
```

### 4. Scheduling Flexibility (`SchedulingFlexibility`)

```typescript
// Zod Schema
export const SchedulingFlexibilitySchema = z.object({
  canSwapShifts: z.boolean(), // 是否可以换班
  advanceNoticeHours: z.number().min(0), // 提前通知小时数
  partTimeAllowed: z.boolean(), // 是否允许兼职
  weekendRequired: z.boolean(), // 是否要求周末工作
  holidayRequired: z.boolean(), // 是否要求节假日工作
});

export type SchedulingFlexibility = z.infer<typeof SchedulingFlexibilitySchema>;
```

### 🆕 5. Attendance Requirement (`AttendanceRequirement`)

```typescript
// Zod Schema
export const AttendanceRequirementSchema = z.object({
  requiredDays: z.array(z.number().min(1).max(7)).optional(), // 必须工作的星期几 (1-7)
  minimumDays: z.number().min(0).optional(), // 每周最少工作天数
  description: z.string(), // 出勤要求描述
});

export type AttendanceRequirement = z.infer<typeof AttendanceRequirementSchema>;
```

### 📋 Predefined Attendance Patterns

```typescript
export const ATTENDANCE_PATTERNS = {
  WEEKENDS: [6, 7], // 周末
  WEEKDAYS: [1, 2, 3, 4, 5], // 工作日
  FRIDAY_TO_SUNDAY: [5, 6, 7], // 周五到周日
  EVERYDAY: [1, 2, 3, 4, 5, 6, 7], // 每天
} as const;
```

## Enhanced Position Schema

The `Position` schema now includes comprehensive attendance and scheduling fields:

```typescript
export const PositionSchema = z.object({
  // 原有字段
  id: z.string(),
  name: z.string(),
  timeSlots: z.array(z.string()),
  baseSalary: z.number().min(0),
  levelSalary: z.string(),
  workHours: z.string(),
  benefits: z.string(),
  requirements: z.array(z.string()),
  urgent: z.boolean(),

  // 🆕 新增：排班和考勤相关字段
  scheduleType: ScheduleTypeSchema,
  attendancePolicy: AttendancePolicySchema,
  availableSlots: z.array(TimeSlotAvailabilitySchema),
  schedulingFlexibility: SchedulingFlexibilitySchema,
  minHoursPerWeek: z.number().min(0).optional(),
  maxHoursPerWeek: z.number().min(0).optional(),
  preferredDays: z.array(z.string()).optional(),
  blackoutDates: z.array(z.string()).optional(),
  attendanceRequirement: AttendanceRequirementSchema.optional(), // 🆕 出勤要求
});

export type Position = z.infer<typeof PositionSchema>;
```

## Runtime Validation Benefits

### 1. Import Validation

Configuration imports are now validated at runtime:

```typescript
// In useConfigManager.ts
const validationResult = AppConfigDataSchema.safeParse(parsedData);
if (!validationResult.success) {
  // Detailed error reporting with field paths
  throw new Error(`配置数据验证失败: ${validationResult.error.message}`);
}
```

### 2. Type Safety Guarantee

All data structures are guaranteed to match their TypeScript types at runtime.

### 3. Schema Evolution

Easy schema migration and validation during version upgrades.

## Updated Sample Data

All 6 positions in the sample data have been updated with comprehensive attendance/schedule information:

### Examples:

1. **pos_001 (前厅岗位)**: 灵活排班，支持换班和兼职
   - `attendanceRequirement`: 最少 3 天，工作日偏好
2. **pos_002 (后厨岗位)**: 固定排班，严格考勤，需要周末和节假日
   - `attendanceRequirement`: 周末必须上岗，最少 5 天
3. **pos_003 (前厅岗位)**: 轮班制，高优先级双时段
   - `attendanceRequirement`: 最少 4 天，时间灵活
4. **pos_004 (前厅岗位)**: 灵活排班，宽松考勤，低优先级
   - `attendanceRequirement`: 最少 3 天，时间灵活
5. **pos_005 (通岗)**: 随叫随到，严格考勤，全职要求
   - `attendanceRequirement`: 工作日全勤，最少 4 天
6. **pos_006 (通岗)**: 固定排班，支持换班
   - `attendanceRequirement`: 最少 3 天，时间灵活

## Enhanced Smart Reply System

### 1. Context Building Enhancement

The `buildContextInfo` function now includes:

- 排班类型显示
- 可预约时段状态 (已预约/总容量，优先级)
- 考勤要求详情 (**🆕 包含 AttendanceRequirement 信息**)
- 排班特点 (可换班、兼职、周末要求等)
- 每周工时范围
- 工作日偏好

### 2. Smart Reply Enhancement

- **Initial Inquiry**: 现在包含排班类型和灵活性信息
- **Schedule Inquiry**: 详细展示排班方式、换班政策和兼职支持
- **🆕 Attendance Inquiry**: 基于 AttendanceRequirement 的出勤要求回复

### 3. Helper Functions

- `getScheduleTypeText()`: 排班类型中文翻译
- `getPriorityText()`: 优先级中文翻译
- `getDayText()`: 工作日中文翻译

## Key Features

### 1. **Capacity Management**

- 每个时间段支持最大容纳人数设置
- 实时追踪已预约人数
- 可用性状态管理

### 2. **Flexible Scheduling**

- 多种排班类型支持
- 换班政策配置
- 兼职/全职支持选项
- 周末和节假日要求设置

### 3. **🆕 Enhanced Attendance Tracking**

- 考勤严格程度配置
- 迟到容忍度设置
- 补班政策管理
- **出勤要求描述和天数限制** (AttendanceRequirement)

### 4. **Priority System**

- 时间段优先级管理
- 高优先级时段优先推荐

### 5. **Constraint Management**

- 每周工时范围限制
- 偏好工作日设置
- 黑名单日期支持

## Backward Compatibility

✅ **完全向后兼容**

- 保留所有原有字段 (`timeSlots`, `workHours` 等)
- 新字段在 schema 中标记为可选，但在迁移时会自动补全默认值
- 现有 API 调用无需修改
- Zod schema 提供运行时验证，确保数据完整性

## Migration & Validation

### Automatic Data Upgrade

系统在检测到旧版本数据时会自动执行升级：

```typescript
// config.service.ts 中的升级逻辑
if (!position.attendanceRequirement) {
  position.attendanceRequirement = generateDefaultAttendanceRequirement({
    name: position.name,
    urgent: position.urgent,
  });
}
```

### Schema Validation

所有配置导入都经过严格的 schema 验证：

- 数据类型验证
- 必填字段检查
- 数值范围验证
- 枚举值验证

## Usage Examples

### 智能回复示例:

```
用户: "你好，我想咨询兼职工作"
系统: "你好，上海各区有成都你六姐门店岗位空缺，兼职排班 2.5 小时。基本薪资：24 元/小时。阶梯薪资：每月做满40小时之后，时薪是26元/时，每月做满80小时后，时薪是28元/时。排班方式：灵活排班，支持兼职，可换班"

用户: "出勤要求是什么？"
系统: "出勤要求是一周至少上岗3天，时间灵活，时间安排可以和店长商量。"
```

### 上下文信息示例:

```
匹配到的门店信息：
• 上海太平洋森活天地店（杨浦区五角场）：淞沪路199号B1层太平洋森活天地A-2
  职位：前厅岗位，时间：11:30~14:00，薪资：24元/时
  排班类型：灵活排班
  可预约时段：11:30~14:00(1/3人，高优先级)
  考勤要求：准时到岗，最多迟到10分钟
  出勤要求：一周至少上岗3天，时间灵活 ← 🆕 AttendanceRequirement
  排班特点：可换班、兼职
  每周工时：10-20小时
  工作日偏好：周一、周二、周三、周四、周五
```

## Files Modified

1. **`/types/zhipin.ts`**: 🔄 迁移到 Zod schema，新增 AttendanceRequirement 等类型
2. **`/types/config.ts`**: 🔄 从 config.d.ts 迁移，采用 Zod schema 架构
3. **`/lib/data/sample-data.ts`**: ✏️ 更新所有岗位的考勤排班数据
4. **`/lib/loaders/zhipin-data.loader.ts`**: ✏️ 增强智能回复生成和上下文构建
5. **`/hooks/useConfigManager.ts`**: 🔄 集成 Zod validation，移除重复 schema 定义
6. **`/lib/services/config.service.ts`**: ✏️ 支持 AttendanceRequirement 的数据升级

## Technical Improvements

### 1. **Schema-First Development**

- 单一数据模型定义源头
- 自动生成 TypeScript 类型
- 运行时类型验证

### 2. **Enhanced Error Handling**

```typescript
// 详细的验证错误信息
const result = PositionSchema.safeParse(data);
if (!result.success) {
  result.error.issues.forEach((issue) => {
    console.error(`字段 ${issue.path.join(".")} 验证失败: ${issue.message}`);
  });
}
```

### 3. **Code Deduplication**

- 消除了类型定义的重复 (~150 行代码减少)
- 统一的验证逻辑
- 更好的维护性

## Next Steps

这个增强为系统提供了：

- 完整的考勤排班管理基础
- 运行时类型安全保障
- 灵活的数据验证机制
- 招聘时提供详细的排班信息
- 候选人咨询时智能匹配时间要求
- 管理员配置灵活的排班政策
- 自动化的容量和可用性管理

系统现在可以处理复杂的排班场景，在招聘对话中提供更准确和详细的信息，同时确保所有数据在运行时都符合预期的类型结构。
