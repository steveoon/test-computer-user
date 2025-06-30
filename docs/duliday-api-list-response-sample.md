# 获取在招岗位列表接口

> 通过组织（brand／BU）ID 等条件，分页获取当前在招岗位列表。

| 属性         | 说明                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| 接口地址     | `POST https://k8s.duliday.com/persistence/a/job-requirement/hiring/list` |
| 请求格式     | `application/json` （UTF-8）                                             |
| 是否需要鉴权 | 是（在请求头携带 `Duliday-Token`）                                       |
| 返回格式     | `application/json`                                                       |

---

## 1 请求示例

```bash
curl -X POST "https://k8s.duliday.com/persistence/a/job-requirement/hiring/list" \
  -H "Content-Type: application/json" \
  -H "Duliday-Token: <YOUR_TOKEN>" \
  -d '{
        "organizationIds": [5],
    "pageNum": 0,
    "pageSize": 20,
    "listOrderBy": 0,
    "supportSupplier": null
}'
```

---

## 2 请求参数说明

| 字段            | 类型          | 必填 | 说明                                        |
| --------------- | ------------- | ---- | ------------------------------------------- |
| organizationIds | number[]      | 是   | 组织／品牌 ID 数组，可一次查询多个组织      |
| pageNum         | number        | 否   | 页码，从 0 开始，默认 0                     |
| pageSize        | number        | 否   | 每页条数，默认 20                           |
| listOrderBy     | number        | 否   | 列表排序方式（0：默认，1：最新发布 …）      |
| supportSupplier | boolean\|null | 否   | 是否仅返回「支持供应商」岗位，null 表示不限 |

---

## 3 返回示例

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "result": [
      {
        "jobBasicInfoId": 33806,
        "jobStoreId": 33172,
        "storeId": 307289,
        "storeName": "刘洁区域-佘山宝地附近就近分配",
        "storeCityId": 310100,
        "storeRegionId": 310117,
        "jobName": "肯德基-刘洁区域-佘山宝地附近就近分配-储备经理-全职",
        "jobId": 523623,
        "cityName": ["上海市"],
        "salary": 5250.0,
        "salaryUnitStr": "元/月",
        "workTimeArrangement": {
          "id": 33710,
          "jobBasicInfoId": 33806,
          "employmentForm": 1,
          "minWorkMonths": 6,
          "temporaryEmploymentStartTime": null,
          "temporaryEmploymentEndTime": null,
          "employmentDescription": null,
          "monthWorkTimeRequirement": 0,
          "perMonthMinWorkTime": null,
          "perMonthMinWorkTimeUnit": null,
          "perMonthMaxRestTime": null,
          "perMonthMaxRestTimeUnit": null,
          "weekWorkTimeRequirement": 3,
          "perWeekNeedWorkDays": null,
          "perWeekWorkDays": 5,
          "perWeekRestDays": 2,
          "evenOddType": null,
          "customWorkTimes": null,
          "dayWorkTimeRequirement": 1,
          "perDayMinWorkHours": 9.0,
          "arrangementType": 3,
          "fixedArrangementTimes": null,
          "combinedArrangementTimes": [
            {
              "jobWorkTimeArrangementId": 33710,
              "startTime": 18000,
              "endTime": 50400,
              "weekdays": [0, 1, 2, 3, 4, 5, 6]
            },
            {
              "jobWorkTimeArrangementId": 33710,
              "startTime": 32400,
              "endTime": 64800,
              "weekdays": [0, 1, 2, 3, 4, 5, 6]
            }
          ],
          "goToWorkStartTime": null,
          "goToWorkEndTime": null,
          "goOffWorkStartTime": null,
          "goOffWorkEndTime": null,
          "maxWorkTakingTime": 30,
          "restTimeDesc": "",
          "workTimeRemark": "早班5-14；中班9-18，晚班16-1:00； 通宵班22-7【通宵班一个月2个班次，不是每个门店都有】\n因为通宵班会影响匹配，因此排班只写了白班，夜班是备注形式"
        },
        "welfare": {
          "id": 33766,
          "jobBasicInfoId": 33806,
          "haveInsurance": 2,
          "accommodation": 0,
          "accommodationSalary": null,
          "accommodationSalaryUnit": null,
          "probationAccommodationSalaryReceive": null,
          "catering": 0,
          "cateringImage": null,
          "cateringSalary": null,
          "cateringSalaryUnit": null,
          "trafficAllowanceSalary": null,
          "trafficAllowanceSalaryUnit": null,
          "otherWelfare": null,
          "moreWelfares": null,
          "insuranceFund": [1, 2, 3, 4, 5, 6],
          "insuranceFundCityId": null,
          "insuranceFundCityStr": null,
          "insuranceFundAmount": null,
          "memo": "基本薪资：底薪5250元+季度奖金1000～1500（一个季度发放一次）\n综合薪资：5250元-5750元\n最高薪资：5750\n其他备注：上海本地五险一金，15号前入职当月缴纳，15号之后次月缴纳",
          "promotionWelfare": "6-8个月一晋升，晋升对应的门店季度奖金也会有晋升\n晋升到餐厅经理将享受到：\n满1年，绩效达标即可免费获得价值2000美元的百胜中国限制性股票，成为公司股东；\n满2年，享受全家福商业保险计划（意外+重疾，涵盖配偶、父母、子女)，为家人的健康保驾护航；\n满3年，享受补充购房福利计划，购房首付免息贷款及按揭利息补贴",
          "accommodationNum": null,
          "commuteDistance": null,
          "accommodationEnv": null,
          "imagesDTOList": null
        },
        "cooperationMode": 3,
        "requirementNum": 1,
        "thresholdNum": 4.0,
        "signUpNum": null,
        "postTime": "2025.06.27 11:13",
        "successDuliriUserId": 360,
        "successNameStr": "高雅琪",
        "storeAddress": "上海市-松江区-佘月路27号一层105-107号肯德基(佘山宝地店)"
      }
    ],
    "total": 57
  }
}
```

---

## 4 返回字段说明

### 4.1 顶层字段

| 字段    | 类型   | 说明                   |
| ------- | ------ | ---------------------- |
| code    | number | 业务状态码；0 表示成功 |
| message | string | 业务提示信息           |
| data    | object | 结果对象               |

### 4.2 data 对象

| 字段   | 类型     | 说明               |
| ------ | -------- | ------------------ |
| result | object[] | 岗位信息列表       |
| total  | number   | 满足条件的岗位总数 |

### 4.3 result 列表项（完整字段）

| 字段                   | 类型            | 说明                                   |
| ---------------------- | --------------- | -------------------------------------- |
| jobBasicInfoId         | number          | 岗位基本信息 ID                        |
| jobStoreId             | number          | 岗位门店 ID                            |
| storeId                | number          | 门店 ID                                |
| storeName              | string          | 门店名称                               |
| storeCityId            | number          | 门店城市 ID                            |
| storeRegionId          | number          | 门店区域 ID                            |
| jobName                | string          | 岗位名称                               |
| jobId                  | number          | 岗位 ID                                |
| cityName               | string[]        | 所在城市                               |
| salary / salaryUnitStr | number / string | 薪资数值及单位（元／月、元／时等）     |
| workTimeArrangement    | object          | 排班／工时安排详情（见下表）           |
| welfare                | object          | 薪酬、保险、住宿、晋升福利等（见下表） |
| cooperationMode        | number          | 合作模式（2：小时工，3：全职等）       |
| requirementNum         | number          | 需求人数                               |
| thresholdNum           | number          | 门槛数量（可为浮点数）                 |
| signUpNum              | number \| null  | 报名人数                               |
| postTime               | string          | 发布时间（`YYYY.MM.DD HH:MM`）         |
| successDuliriUserId    | number          | 成功对接人用户 ID                      |
| successNameStr         | string          | 成功对接人姓名                         |
| storeAddress           | string          | 门店地址                               |

### 4.4 workTimeArrangement 对象字段

| 字段                         | 类型           | 说明                                  |
| ---------------------------- | -------------- | ------------------------------------- |
| id                           | number         | 工时安排 ID                           |
| jobBasicInfoId               | number         | 关联的岗位基本信息 ID                 |
| employmentForm               | number         | 雇佣形式                              |
| minWorkMonths                | number         | 最少工作月数                          |
| temporaryEmploymentStartTime | string \| null | 临时雇佣开始时间                      |
| temporaryEmploymentEndTime   | string \| null | 临时雇佣结束时间                      |
| employmentDescription        | string \| null | 雇佣描述                              |
| monthWorkTimeRequirement     | number         | 月工时要求                            |
| perMonthMinWorkTime          | number \| null | 每月最少工作时间                      |
| perMonthMinWorkTimeUnit      | number \| null | 每月最少工作时间单位                  |
| perMonthMaxRestTime          | number \| null | 每月最大休息时间                      |
| perMonthMaxRestTimeUnit      | number \| null | 每月最大休息时间单位                  |
| weekWorkTimeRequirement      | number         | 周工时要求                            |
| perWeekNeedWorkDays          | number \| null | 每周需要工作天数                      |
| perWeekWorkDays              | number         | 每周工作天数                          |
| perWeekRestDays              | number         | 每周休息天数                          |
| evenOddType                  | number \| null | 单双排班类型                          |
| customWorkTimes              | array \| null  | 自定义工作时间                        |
| dayWorkTimeRequirement       | number         | 日工时要求                            |
| perDayMinWorkHours           | number         | 每日最少工作小时数                    |
| arrangementType              | number         | 排班类型（1：固定，2：灵活，3：组合） |
| fixedArrangementTimes        | array \| null  | 固定排班时间                          |
| combinedArrangementTimes     | array \| null  | 组合排班时间                          |
| goToWorkStartTime            | number \| null | 上班开始时间（秒数）                  |
| goToWorkEndTime              | number \| null | 上班结束时间（秒数）                  |
| goOffWorkStartTime           | number \| null | 下班开始时间（秒数）                  |
| goOffWorkEndTime             | number \| null | 下班结束时间（秒数）                  |
| maxWorkTakingTime            | number         | 最大接单时间（分钟）                  |
| restTimeDesc                 | string         | 休息时间描述                          |
| workTimeRemark               | string         | 工时备注                              |

### 4.5 welfare 对象字段

| 字段                                | 类型             | 说明                                    |
| ----------------------------------- | ---------------- | --------------------------------------- |
| id                                  | number           | 福利 ID                                 |
| jobBasicInfoId                      | number           | 关联的岗位基本信息 ID                   |
| haveInsurance                       | number           | 是否有保险（0：无，1：有，2：特殊情况） |
| accommodation                       | number           | 住宿情况（0：无住宿）                   |
| accommodationSalary                 | number \| null   | 住宿补贴金额                            |
| accommodationSalaryUnit             | number \| null   | 住宿补贴单位                            |
| probationAccommodationSalaryReceive | number \| null   | 试用期住宿补贴                          |
| catering                            | number           | 餐饮情况（0：无餐饮）                   |
| cateringImage                       | string \| null   | 餐饮图片                                |
| cateringSalary                      | number \| null   | 餐饮补贴金额                            |
| cateringSalaryUnit                  | number \| null   | 餐饮补贴单位                            |
| trafficAllowanceSalary              | number \| null   | 交通补贴金额                            |
| trafficAllowanceSalaryUnit          | number \| null   | 交通补贴单位                            |
| otherWelfare                        | string \| null   | 其他福利                                |
| moreWelfares                        | string \| null   | 更多福利                                |
| insuranceFund                       | number[] \| null | 保险基金类型数组                        |
| insuranceFundCityId                 | number \| null   | 保险基金城市 ID                         |
| insuranceFundCityStr                | string \| null   | 保险基金城市字符串                      |
| insuranceFundAmount                 | number \| null   | 保险基金金额                            |
| memo                                | string \| null   | 薪资备注                                |
| promotionWelfare                    | string \| null   | 晋升福利说明                            |
| accommodationNum                    | number \| null   | 住宿数量                                |
| commuteDistance                     | number \| null   | 通勤距离                                |
| accommodationEnv                    | string \| null   | 住宿环境                                |
| imagesDTOList                       | array \| null    | 图片列表                                |

---

## 5 补充说明

### 5.1 时间格式说明

- `startTime`、`endTime`：使用秒数表示当日时间，例如：
  - `18000` = 5:00:00（5 小时 × 3600 秒）
  - `32400` = 9:00:00（9 小时 × 3600 秒）
  - `50400` = 14:00:00（14 小时 × 3600 秒）
  - `64800` = 18:00:00（18 小时 × 3600 秒）
- `postTime`：字符串格式 `YYYY.MM.DD HH:MM`

### 5.2 数据类型说明

- 大部分数值字段可能为浮点数（如 `salary: 5250.0`、`thresholdNum: 4.0`）
- 数组字段在无数据时通常为 `null` 而不是空数组
- `weekdays` 数组：0=周日，1=周一，...，6=周六

---

## 6 错误码

| code | message      | 说明                   |
| ---- | ------------ | ---------------------- |
| 0    | 操作成功     | 请求成功               |
| 1001 | 无效 Token   | 请重新登录获取新 Token |
| 2001 | 参数校验失败 | 检查必填字段           |

---

## 7 变更记录

| 版本 | 日期       | 说明                                           |
| ---- | ---------- | ---------------------------------------------- |
| v1.0 | 2025-06-27 | 首次整理接口文档                               |
| v1.1 | 2025-06-30 | 根据真实生产数据更新所有字段，补充完整字段说明 |
