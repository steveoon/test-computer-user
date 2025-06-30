# Duliday API 列表接口与本地数据结构映射关系

本文档记录了 Duliday API **列表接口** (`/job-requirement/hiring/list`) 返回的数据结构与我们本地系统中 `types/zhipin.ts` 数据结构的映射关系。

**设计原则**: 为简化数据转换逻辑，我们只使用列表接口的字段进行数据映射，不依赖详情接口的额外数据。缺失的字段将通过业务规则推断或设置合理默认值。

## 1. 门店（Store）级别映射

| Duliday API 字段  | 我们系统字段           | 业务含义     | 映射规则                                             |
| ----------------- | ---------------------- | ------------ | ---------------------------------------------------- |
| `storeId`         | `Store.id`             | 门店唯一标识 | 转换为字符串: `store_${storeId}`                     |
| `storeName`       | `Store.name`           | 门店名称     | 直接映射                                             |
| `storeAddress`    | `Store.location`       | 门店地址     | 直接映射                                             |
| `cityName[0]`     | `ZhipinData.city`      | 城市名称     | 取数组第一个元素                                     |
| `jobName`         | `Store.brand`          | 品牌名称     | 从岗位名称解析品牌（如："肯德基-xxx" → "肯德基"）    |
| `storeAddress`    | `Store.district`       | 区域名称     | 从地址解析区域（如："上海市-松江区-xxx" → "松江区"） |
| `storeName`       | `Store.subarea`        | 子区域/商圈  | 从门店名称解析（如："佘山宝地附近" → "佘山宝地"）    |
| -                 | `Store.coordinates`    | 经纬度坐标   | 设置默认值 `{lat: 0, lng: 0}`                        |
| -                 | `Store.transportation` | 交通信息     | 设置默认值 "交通便利"                                |
| -                 | `Store.positions`      | 岗位列表     | 从当前岗位数据生成 Position 对象数组                 |

### 1.1 解析规则说明

**品牌名称解析**:
```typescript
// 从 jobName 中提取品牌名称
const brandName = jobName.split('-')[0]; // "肯德基-xxx" → "肯德基"
```

**区域名称解析**:
```typescript
// 从 storeAddress 中提取区域
const district = storeAddress.split('-')[1]; // "上海市-松江区-xxx" → "松江区"
```

**子区域解析**:
```typescript
// 从 storeName 中提取子区域关键词
const subarea = extractSubarea(storeName); // "佘山宝地附近" → "佘山宝地"
```

## 2. 岗位（Position）级别映射

### 2.1 基础岗位信息

| Duliday API 字段     | 我们系统字段          | 业务含义     | 映射规则                                          |
| -------------------- | --------------------- | ------------ | ------------------------------------------------- |
| `jobId`              | `Position.id`         | 岗位唯一标识 | 转换为字符串: `pos_${jobId}`                      |
| `jobName`            | `Position.name`       | 岗位名称     | 解析岗位类型（如："肯德基-xx-储备经理-全职" → "储备经理"） |
| `salary` + `welfare.*` | `Position.salary`   | 结构化薪资   | 解析为 SalaryDetails 对象（见下表）               |
| `welfare.*`          | `Position.benefits`   | 结构化福利   | 解析为 Benefits 对象（见下表）                    |
| `cooperationMode`    | `Position.scheduleType`| 排班类型    | 2="flexible"(兼职), 3="fixed"(全职)               |
| `requirementNum > 3` | `Position.urgent`     | 是否紧急     | 需求人数大于3时标记为紧急                         |
| -                    | `Position.requirements`| 岗位要求    | 设置默认要求数组                                  |

### 2.2 结构化薪资对象（SalaryDetails）映射

| Duliday API 字段             | SalaryDetails 字段 | 业务含义       | 映射规则                                        |
| ---------------------------- | ------------------ | -------------- | ----------------------------------------------- |
| `salary`                     | `base`             | 基础薪资       | 直接映射数值                                    |
| `welfare.memo` (解析)        | `range`            | 薪资范围       | 从 memo 中提取"5250元-5750元"类似文本           |
| `welfare.memo` (解析)        | `bonus`            | 奖金说明       | 从 memo 中提取"季度奖金1000～1500"类似文本      |
| `welfare.memo`               | `memo`             | 原始备注       | 保留完整的薪资备注文本                          |

### 2.3 结构化福利对象（Benefits）映射

| Duliday API 字段                     | Benefits 字段      | 业务含义       | 映射规则                                        |
| ------------------------------------ | ------------------ | -------------- | ----------------------------------------------- |
| `welfare.promotionWelfare`           | `promotion`        | 晋升福利       | 直接映射（可选）                                |
| `welfare.moreWelfares[]` + `welfare.*` | `items`          | 福利项目数组   | 从结构化数组和其他字段解析出福利项目列表        |

**福利项目解析优先级**:
1. `welfare.moreWelfares[]`: 结构化福利数组（优先使用，来自 details 接口）
2. `welfare.haveInsurance/accommodation/catering`: 基础福利标志
3. `welfare.memo`: 文本解析补充（备用）

### 2.4 时间安排（workTimeArrangement）映射

| Duliday API 字段                               | 我们系统字段                                 | 业务含义         | 映射规则                                    |
| ---------------------------------------------- | -------------------------------------------- | ---------------- | ------------------------------------------- |
| `workTimeArrangement.combinedArrangementTimes`| `Position.timeSlots`                         | 班次时间         | 转换秒数为时间字符串数组                    |
| `workTimeArrangement.perDayMinWorkHours`      | `Position.workHours`                         | 每班工时         | 转换为字符串 `String(perDayMinWorkHours)`   |
| `workTimeArrangement.perWeekWorkDays`         | `Position.attendanceRequirement.minimumDays`| 每周最少工作天数 | 直接映射                                    |
| `workTimeArrangement.combinedArrangementTimes[].weekdays`| `Position.attendanceRequirement.requiredDays`| 工作日要求| 转换星期映射: 0-6 → 1-7                     |
| `workTimeArrangement.workTimeRemark`          | `Position.attendanceRequirement.description` | 工时备注         | 直接映射                                    |
| `workTimeArrangement.perDayMinWorkHours * perWeekWorkDays`| `Position.minHoursPerWeek`| 每周最少工时| 计算得出                                    |
| `workTimeArrangement.perDayMinWorkHours * 7`  | `Position.maxHoursPerWeek`                   | 每周最多工时     | 估算值（每日工时×7）                        |

### 2.3 时间格式转换规则

**班次时间转换**:
```typescript
// 将秒数转换为时间字符串
function convertTimeSlots(combinedArrangementTimes: any[]): string[] {
  return combinedArrangementTimes.map(slot => {
    const startHour = Math.floor(slot.startTime / 3600);
    const startMin = Math.floor((slot.startTime % 3600) / 60);
    const endHour = Math.floor(slot.endTime / 3600);
    const endMin = Math.floor((slot.endTime % 3600) / 60);
    return `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}~${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  });
}
```

**星期映射转换**:
```typescript
// Duliday: 0=周日, 1=周一, ..., 6=周六
// 本地系统: 1=周一, 2=周二, ..., 7=周日
function convertWeekdays(dulidayWeekdays: number[]): number[] {
  return dulidayWeekdays.map(day => day === 0 ? 7 : day);
}
```

### 2.4 考勤政策映射（基于推断规则）

| 推断来源                    | 我们系统字段                                     | 业务含义     | 推断规则                                      |
| --------------------------- | ------------------------------------------------ | ------------ | --------------------------------------------- |
| `cooperationMode`           | `Position.attendancePolicy.punctualityRequired` | 准时要求     | 全职(3)=true, 兼职(2)=false                  |
| `cooperationMode`           | `Position.attendancePolicy.lateToleranceMinutes`| 迟到容忍度   | 全职=5分钟, 兼职=15分钟                       |
| `cooperationMode`           | `Position.attendancePolicy.attendanceTracking`  | 考勤严格度   | 全职="strict", 兼职="flexible"                |
| `workTimeArrangement.arrangementType`| `Position.attendancePolicy.makeupShiftsAllowed`| 是否允许补班 | 固定排班(1)=false, 组合排班(3)=true           |

### 2.5 排班灵活性映射（基于推断规则）

| 推断来源                              | 我们系统字段                                        | 业务含义     | 推断规则                                    |
| ------------------------------------- | --------------------------------------------------- | ------------ | ------------------------------------------- |
| `workTimeArrangement.arrangementType` | `Position.schedulingFlexibility.canSwapShifts`     | 可否换班     | 组合排班(3)=true, 固定排班(1)=false        |
| `workTimeArrangement.maxWorkTakingTime`| `Position.schedulingFlexibility.advanceNoticeHours`| 提前通知时间 | 分钟转小时: `maxWorkTakingTime / 60`        |
| `cooperationMode`                     | `Position.schedulingFlexibility.partTimeAllowed`   | 允许兼职     | 兼职(2)=true, 全职(3)=false                |
| `combinedArrangementTimes[].weekdays` | `Position.schedulingFlexibility.weekendRequired`   | 需要周末班   | 包含0或6=true                               |
| -                                     | `Position.schedulingFlexibility.holidayRequired`   | 需要节假日班 | 默认值: false                               |

### 2.6 时间段可用性映射

| Duliday API 字段                              | 我们系统字段                              | 业务含义   | 映射规则                                |
| --------------------------------------------- | ----------------------------------------- | ---------- | --------------------------------------- |
| `workTimeArrangement.combinedArrangementTimes`| `Position.availableSlots[].slot`         | 时间段     | 转换为时间字符串格式                    |
| `requirementNum`                              | `Position.availableSlots[].maxCapacity`  | 最大容量   | 直接映射                                |
| `signUpNum ?? 0`                              | `Position.availableSlots[].currentBooked`| 已预定人数 | null时设为0                             |
| `signUpNum < requirementNum`                  | `Position.availableSlots[].isAvailable`  | 是否可用   | 计算得出                                |
| `requirementNum > 3 ? "high" : "medium"`     | `Position.availableSlots[].priority`     | 优先级     | 根据需求量判断                          |

## 3. 默认值和推断字段映射

### 3.1 未在列表接口中提供的字段

以下字段在列表接口中不存在，需要设置合理的默认值：

| 我们系统字段                    | 默认值策略                                     | 说明                           |
| ------------------------------- | ---------------------------------------------- | ------------------------------ |
| `Position.requirements`         | 根据岗位类型设置通用要求                       | 如：["健康证", "工作认真负责"] |
| `Position.preferredDays`        | 从 `workTimeArrangement` 的工作日推断         | 可选字段                       |
| `Position.blackoutDates`        | 空数组 `[]`                                    | 可选字段                       |
| `Store.coordinates`             | `{lat: 0, lng: 0}`                             | 需要后续地理编码               |
| `Store.transportation`          | "交通便利"                                     | 通用描述                       |

### 3.3 福利信息处理策略

**福利字段的优先级选择**:
- `welfare.promotionWelfare`: 优先用于 `benefits` 和 `levelSalary`，包含晋升相关福利
- `welfare.memo`: 作为备选，包含薪资构成详情，可用于补充说明
- 如果 `promotionWelfare` 为空，可回退到解析 `memo` 中的福利相关内容

### 3.2 系统不存储的API字段

以下API字段在我们系统中不需要存储：

| Duliday API 字段      | 说明                     | 用途                           |
| --------------------- | ------------------------ | ------------------------------ |
| `postTime`            | 岗位发布时间             | 可用于排序或过期判断           |
| `thresholdNum`        | 门槛数量                 | 业务逻辑参考，影响紧急度判断   |
| `successDuliriUserId` | 对接人用户ID             | 内部管理字段                   |
| `successNameStr`      | 对接人姓名               | 内部管理字段                   |
| `jobStoreId`          | 岗位门店关联ID           | 数据库关联字段                 |
| `jobBasicInfoId`      | 岗位基本信息ID           | 用于调用详情接口（我们不使用） |
| `storeCityId`         | 门店城市ID               | 可用于筛选，但我们用字符串     |
| `storeRegionId`       | 门店区域ID               | 可用于筛选，但我们用字符串     |

## 4. 数据转换实施指南

### 4.1 关键数据类型转换

#### 4.1.1 ID字段转换
```typescript
// 统一转换为字符串格式
const storeId = `store_${dulidayData.storeId}`;
const positionId = `pos_${dulidayData.jobId}`;
```

#### 4.1.2 时间格式转换
```typescript
// 秒数转时间字符串
function convertSecondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// 时间段转换
function convertTimeSlot(slot: any): string {
  const start = convertSecondsToTime(slot.startTime);
  const end = convertSecondsToTime(slot.endTime);
  return `${start}~${end}`;
}
```

#### 4.1.3 星期映射转换
```typescript
// Duliday: 0=周日, 1=周一, ..., 6=周六
// 本地系统: 1=周一, 2=周二, ..., 7=周日
function convertWeekday(dulidayDay: number): number {
  return dulidayDay === 0 ? 7 : dulidayDay;
}
```

### 4.2 枚举值映射

#### cooperationMode (合作模式)
- `2`: 小时工/兼职 → `scheduleType: "flexible"`
- `3`: 全职 → `scheduleType: "fixed"`

#### arrangementType (排班类型)
- `1`: 固定排班
- `3`: 组合排班

#### haveInsurance (保险状态)
- `0`: 无保险
- `1`: 有保险  
- `2`: 特殊情况

### 4.3 字符串解析规则

#### 品牌名称解析
```typescript
function extractBrandName(jobName: string): string {
  return jobName.split('-')[0] || '未知品牌';
}
```

#### 岗位类型解析
```typescript
function extractPositionType(jobName: string): string {
  const parts = jobName.split('-');
  return parts[parts.length - 2] || '服务员'; // 倒数第二个部分通常是岗位类型
}
```

#### 区域解析
```typescript
function extractDistrict(storeAddress: string): string {
  const parts = storeAddress.split('-');
  return parts[1] || '未知区域'; // 第二部分通常是区域
}
```

### 4.4 数据验证和容错

#### 必填字段检查
```typescript
function validateRequiredFields(data: any): boolean {
  const required = ['jobId', 'storeName', 'salary', 'jobName'];
  return required.every(field => data[field] !== undefined && data[field] !== null);
}
```

#### 默认值设置
```typescript
function setDefaultValues(position: Partial<Position>): Position {
  return {
    requirements: ['工作认真负责', '有相关工作经验者优先'],
    coordinates: { lat: 0, lng: 0 },
    transportation: '交通便利',
    ...position,
  } as Position;
}
```

## 5. 完整转换示例代码

### 5.1 核心转换函数

```typescript
import { Store, Position, ZhipinData, DulidayRaw, SalaryDetails, Benefits } from '../types/zhipin';

// 主转换函数
function convertDulidayListToZhipinData(dulidayResponse: DulidayRaw.ListResponse): ZhipinData {
  const stores = new Map<string, Store>();
  
  dulidayResponse.data.result.forEach((item: DulidayRaw.Position) => {
    const storeId = `store_${item.storeId}`;
    
    if (!stores.has(storeId)) {
      stores.set(storeId, convertToStore(item));
    }
    
    const position = convertToPosition(item);
    stores.get(storeId)!.positions.push(position);
  });

  return {
    city: dulidayResponse.data.result[0]?.cityName[0] || '上海市',
    stores: Array.from(stores.values()),
    brands: generateBrandConfigs(Array.from(stores.values())),
  };
}

// 门店转换
function convertToStore(dulidayData: DulidayRaw.Position): Store {
  return {
    id: `store_${dulidayData.storeId}`,
    name: dulidayData.storeName,
    location: dulidayData.storeAddress,
    district: extractDistrict(dulidayData.storeAddress),
    subarea: extractSubarea(dulidayData.storeName),
    coordinates: { lat: 0, lng: 0 },
    transportation: '交通便利',
    brand: extractBrandName(dulidayData.jobName),
    positions: [], // 将在后续添加
  };
}

// 岗位转换
function convertToPosition(dulidayData: DulidayRaw.Position): Position {
  const workTimeArrangement = dulidayData.workTimeArrangement;
  
  return {
    id: `pos_${dulidayData.jobId}`,
    name: extractPositionType(dulidayData.jobName),
    timeSlots: convertTimeSlots(workTimeArrangement.combinedArrangementTimes || []),
    // 🔧 使用结构化的薪资对象
    salary: parseSalaryDetails(dulidayData.salary, dulidayData.welfare),
    workHours: String(workTimeArrangement.perDayMinWorkHours ?? 8),
    // 🔧 使用结构化的福利对象
    benefits: parseBenefits(dulidayData.welfare),
    requirements: generateDefaultRequirements(dulidayData.jobName),
    urgent: dulidayData.requirementNum > 3,
    scheduleType: dulidayData.cooperationMode === 2 ? 'flexible' : 'fixed',
    attendancePolicy: generateAttendancePolicy(dulidayData.cooperationMode),
    availableSlots: generateAvailableSlots(dulidayData),
    schedulingFlexibility: generateSchedulingFlexibility(dulidayData),
    minHoursPerWeek: calculateMinHoursPerWeek(workTimeArrangement),
    maxHoursPerWeek: calculateMaxHoursPerWeek(workTimeArrangement),
    attendanceRequirement: {
      minimumDays: workTimeArrangement.perWeekWorkDays || 5,
      requiredDays: convertWeekdays(workTimeArrangement.combinedArrangementTimes?.[0]?.weekdays || [1,2,3,4,5]),
      description: workTimeArrangement.workTimeRemark || '',
    },
  };
}
```

### 5.2 辅助函数

```typescript
// 生成默认岗位要求
function generateDefaultRequirements(jobName: string): string[] {
  const base = ['工作认真负责', '团队合作精神'];
  
  if (jobName.includes('服务员')) {
    return [...base, '有服务行业经验优先', '沟通能力强'];
  }
  if (jobName.includes('经理')) {
    return [...base, '有管理经验', '责任心强'];
  }
  
  return [...base, '有相关工作经验者优先'];
}

// 计算工时（处理可能为 null 的字段）
function calculateMinHoursPerWeek(workTimeArrangement: DulidayRaw.WorkTimeArrangement): number {
  const dailyHours = workTimeArrangement.perDayMinWorkHours ?? 8;
  const workDays = workTimeArrangement.perWeekWorkDays ?? 5;
  return dailyHours * workDays;
}

function calculateMaxHoursPerWeek(workTimeArrangement: DulidayRaw.WorkTimeArrangement): number {
  const dailyHours = workTimeArrangement.perDayMinWorkHours ?? 8;
  return dailyHours * 7; // 最多每天都工作
}

// 🔧 结构化薪资解析
function parseSalaryDetails(baseSalary: number, welfare: DulidayRaw.Welfare): SalaryDetails {
  const memo = welfare.memo || '';
  
  // 提取薪资范围，如 "5250元-5750元"
  const rangeMatch = memo.match(/(\d+元?-\d+元?)/);
  const range = rangeMatch ? rangeMatch[1] : undefined;
  
  // 提取奖金信息，如 "季度奖金1000～1500"
  const bonusMatch = memo.match(/(奖金[\d～\-~元]+)/);
  const bonus = bonusMatch ? bonusMatch[1] : undefined;
  
  return {
    base: baseSalary,
    range,
    bonus,
    memo: memo,
  };
}

// 🔧 结构化福利解析
function parseBenefits(welfare: DulidayRaw.Welfare): Benefits {
  const benefitItems: string[] = [];
  
  // 基础福利检测
  if (welfare.haveInsurance > 0) {
    benefitItems.push('五险一金');
  }
  
  // 住宿福利
  if (welfare.accommodation > 0) {
    benefitItems.push('住宿');
  }
  
  // 餐饮福利
  if (welfare.catering > 0) {
    benefitItems.push('餐饮');
  }
  
  // 从 moreWelfares 数组中提取福利项目
  if (welfare.moreWelfares && Array.isArray(welfare.moreWelfares)) {
    welfare.moreWelfares.forEach(item => {
      const content = item.content;
      const benefitKeywords = ['保险', '年假', '补贴', '福利', '股票', '学历提升'];
      benefitKeywords.forEach(keyword => {
        if (content.includes(keyword) && !benefitItems.some(existingItem => existingItem.includes(keyword))) {
          // 提取关键信息，如 "10天带薪年假" -> "带薪年假"
          const match = content.match(new RegExp(`\\d*[天个月年]*${keyword}[^，。]*`));
          benefitItems.push(match ? match[0] : keyword);
        }
      });
    });
  }
  
  // 从memo中智能提取其他福利（作为补充）
  if (welfare.memo) {
    const benefitKeywords = ['年假', '补贴', '商保', '股票', '学历提升'];
    benefitKeywords.forEach(keyword => {
      if (welfare.memo!.includes(keyword) && !benefitItems.some(item => item.includes(keyword))) {
        benefitItems.push(keyword);
      }
    });
  }
  
  // 如果没有找到任何福利，添加默认项
  if (benefitItems.length === 0) {
    benefitItems.push('按国家规定');
  }
  
  return {
    items: benefitItems,
    promotion: welfare.promotionWelfare || undefined,
  };
}
```

## 6. 实施建议

### 6.1 结构化数据模型的优势
- **类型安全**: 使用 Zod schema 确保运行时和编译时的类型安全
- **智能解析**: `parseSalaryDetails` 和 `parseBenefits` 函数将原始文本解析为结构化对象
- **组件友好**: 前端组件可以稳定地访问 `position.salary.range` 而无需字符串处理
- **测试便利**: 强类型的映射函数 `(raw: DulidayRaw.Position) => Position` 更易于单元测试

### 6.2 简化策略
- **单一数据源**: 只使用列表接口，避免复杂的双接口整合
- **智能推断**: 基于现有字段推断缺失信息
- **合理默认值**: 为无法推断的字段设置业务合理的默认值

### 6.3 数据质量保证
- **字段验证**: 使用 Zod schema 验证转换后的数据
- **容错处理**: 处理API字段缺失或格式异常
- **日志记录**: 记录转换过程中的警告和错误

### 6.4 性能优化
- **批量处理**: 一次处理多个岗位数据
- **缓存机制**: 缓存转换结果和配置信息
- **增量更新**: 支持数据的增量同步

## 7. 变更记录

| 版本 | 日期       | 说明                                         |
| ---- | ---------- | -------------------------------------------- |
| v1.0 | 2025-06-30 | 初始版本，基于列表接口和详情接口的双重映射   |
| v2.0 | 2025-06-30 | 重构为仅基于列表接口的单一映射，简化实现逻辑 |
| v2.1 | 2025-06-30 | 修复福利字段映射冲突，使用 `promotionWelfare` 而非 `memo` |
| v3.0 | 2025-06-30 | 引入结构化数据模型：SalaryDetails 和 Benefits，添加 DulidayRaw 命名空间 |
| v3.1 | 2025-06-30 | 修复接口不一致：moreWelfares 数组结构，perDayMinWorkHours 和 perWeekWorkDays 可空 |
