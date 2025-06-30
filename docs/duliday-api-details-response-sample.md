# 获取岗位详情接口

> 根据岗位 `jobBasicInfoId` 获取该岗位的完整详情（基础信息、薪资福利、招聘要求、门店／公司信息等）。

| 属性         | 说明                                                                 |
| ------------ | -------------------------------------------------------------------- |
| 接口地址     | `POST https://k8s.duliday.com/persistence/a/job-requirement/details` |
| 请求格式     | `application/json` (UTF-8)                                           |
| 是否需要鉴权 | 是（请求头 `Duliday-Token`）                                         |
| 返回格式     | `application/json`                                                   |

---

## 1 请求示例

```bash
curl -X POST "https://k8s.duliday.com/persistence/a/job-requirement/details" \
  -H "Content-Type: application/json" \
  -H "Duliday-Token: <YOUR_TOKEN>" \
  -d '{"jobBasicInfoIds": [33323]}'
```

---

## 2 请求参数说明

| 字段            | 类型     | 必填 | 说明                                           |
| --------------- | -------- | ---- | ---------------------------------------------- |
| jobBasicInfoIds | number[] | 是   | 岗位 BasicInfoId 数组，支持批量（建议 ≤20 个） |

---

## 3 返回示例

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "basicInfo": {
      "id": 33806,
      "parentId": null,
      "jobName": "肯德基-刘洁区域-佘山宝地附近就近分配-储备经理-全职",
      "jobNickName": "",
      "organizationId": 5,
      "organizationName": "肯德基",
      "jobId": 523623,
      "companyId": 119,
      "companyName": "百胜中国控股有限公司",
      "companyAddress": "1",
      "jobType": 214,
      "jobTypeName": "储备经理",
      "cityIds": [310100],
      "cityStrList": ["上海市"],
      "jobContent": "您将从事: - 餐厅现场人员管理，订货排班，成本控制设备维护等营运系统管理工作 您将得到：\n1、进入与您职业发展匹配的领军人物养成计划，开启自己作为管理者的职业生涯。领军人物养成计划提供的学习课程媲美商学院且为职场新人量身定制，选拔超豪华的千人讲师团队悉心授教；\n2、最初在储备经理这个岗位上的6个月，将学会全方位餐厅经营与领导力的基础课程，完成从一个职场新人向餐厅副经理发展的重要过程；\n3、沿着我们清晰的职业发展路径，继而晋升为副经理、资深副经理；\n4、最快2年就能成为餐厅经理，独当一面，带领餐厅，在百胜的企业文化中餐厅经理被认为是最重要的领导者。",
      "cooperationMode": 3,
      "laborForm": 2,
      "haveProbation": 1,
      "needProbationWork": 0,
      "needTraining": 0,
      "status": 1,
      "supportSupplier": 1,
      "hidden": false
    },
    "salaryWelfare": {
      "jobSalaries": [
        {
          "id": 55586,
          "jobBasicInfoId": 33806,
          "salaryPeriod": 3,
          "monthSalaryPeriodTime": 10,
          "weedSalaryPeriodTime": null,
          "halfMonthSalaryPeriodTime": [],
          "salary": 5250.0,
          "salaryUnit": 3,
          "haveStairSalary": 2,
          "holidaySalary": 1,
          "holidaySalaryMultiple": 3.0,
          "holidayFixedSalary": null,
          "holidayFixedSalaryUnit": null,
          "holidaySalaryDesc": "",
          "overtimeSalary": 3,
          "overtimeSalaryMultiple": null,
          "overtimeFixedSalary": null,
          "overtimeFixedSalaryUnit": null,
          "overtimeSalaryDesc": "",
          "commission": null,
          "attendenceSalary": null,
          "performance": "季度奖金1000～1500（一个季度发放一次），平均300-500一月",
          "attendenceSalaryUnit": null,
          "minComprehensiveSalary": 5250.0,
          "maxComprehensiveSalary": 5750.0,
          "comprehensiveSalaryUnit": 3,
          "memo": null,
          "stairDescription": null,
          "type": 0,
          "jobSalaryStairs": null,
          "jobSalaryCustoms": null
        }
      ],
      "jobProbationSalary": null,
      "jobWelfare": {
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
        "moreWelfares": [
          {
            "content": "1、缴纳上海五险一金，还缴纳补充医疗保险，小孩的商保",
            "image": null
          },
          {
            "content": "2、肯德基有合作大学可实现学历提升，中专升大专，大专升本科",
            "image": null
          },
          {
            "content": "3、10天带薪年假一入职就有，且满3年的话再加5天",
            "image": null
          }
        ],
        "insuranceFund": [1, 2, 3, 4, 5, 6],
        "insuranceFundCityId": null,
        "insuranceFundCityStr": null,
        "insuranceFundAmount": null,
        "memo": "基本薪资：底薪5250元+季度奖金1000～1500（一个季度发放一次）\n综合薪资：5250元-5750元\n最高薪资：5750\n其他备注：上海本地五险一金，15号前入职当月缴纳，15号之后次月缴纳",
        "promotionWelfare": "6-8个月一晋升，晋升对应的门店季度奖金也会有晋升\n晋升到餐厅经理将享受到：\n满1年，绩效达标即可免费获得价值2000美元的百胜中国限制性股票，成为公司股东；\n满2年，享受全家福商业保险计划（意外+重疾，涵盖配偶、父母、子女)，为家人的健康保驾护航；\n满3年，享受补充购房福利计划，购房首付免息贷款及按揭利息补贴",
        "accommodationNum": null,
        "commuteDistance": null,
        "accommodationEnv": null,
        "imagesDTOList": []
      }
    },
    "hiringRequirement": {
      "id": 33710,
      "figureId": 0,
      "educationId": 3,
      "genderIds": [1, 2],
      "manMinHeight": 160,
      "manMaxHeight": 190,
      "manMinWeight": 40,
      "manMaxWeight": 100,
      "womanMinHeight": 160,
      "womanMaxHeight": 190,
      "womanMinWeight": 40,
      "womanMaxWeight": 100,
      "minAge": 18,
      "maxAge": 30,
      "nativePlaceRequirementType": 0,
      "nativePlaceIds": [],
      "nativePlaceStrList": null,
      "countryRequirementType": 2,
      "nationRequirementType": 0,
      "nationIds": [],
      "marriageBearingType": 0,
      "marriageBearingStatus": null,
      "socialSecurityRequirementType": 0,
      "socialSecurityTypes": [],
      "workExperienceJobType": null,
      "workExperienceJobTypeStr": null,
      "minWorkTime": null,
      "minWorkTimeUnit": null,
      "certificates": [1],
      "healthCertificateType": 1,
      "driverLicenseType": null,
      "languages": [1],
      "languageRemark": null,
      "workingAttitude": null,
      "serviceAwareness": null,
      "affinity": null,
      "extroversion": null,
      "expression": null,
      "appearance": null,
      "softSkill": "工作态度（良好）,服务意识（良好）,亲和力（良好）,性格外向程度（良好）,沟通表达能力（良好）,外貌（一般）",
      "remark": "1、肯德基比较喜欢上海本地人，外地来上海的毕业生上海有父母亲戚朋友的或者定居上海的，沟通谈吐好，稳定性好，或者在肯德基做过兼职的\n2、肯德基二次入职的人员可以接受"
    },
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
    "processRequirement": {
      "id": 33710,
      "jobBasicInfoId": 33806,
      "storeRelatedDemand": 1,
      "interviewTotal": 1,
      "interviewMode": null,
      "interviewTimeMode": 2,
      "firstInterviewWay": 2,
      "secondInterviewWay": null,
      "thirdInterviewWay": null,
      "firstInterviewAddressMode": null,
      "secondInterviewAddressMode": null,
      "thirdInterviewAddressMode": null,
      "interviewAddressRegionId": null,
      "interviewAddressRegionStr": null,
      "interviewAddressCityStr": null,
      "interviewAddressText": null,
      "secondInterviewAddressText": null,
      "thirdInterviewAddressText": null,
      "interviewDemand": "--面试时间周二、周四14:30开始，请准点入场；\n--独立日：提醒候选人入场后修改名字，未到面试时间请勿开麦；\n--面试间：点击链接入会，或添加至会议列表：\nhttps://meeting.tencent.com/dm/cQGgHltKNEgF\n\n#腾讯会议：471-6451-3403",
      "secondInterviewDemand": null,
      "thirdInterviewDemand": null,
      "firstInterviewDesc": "腾讯会议面试",
      "secondInterviewDesc": null,
      "thirdInterviewDesc": null,
      "trainMode": null,
      "trainAddress": null,
      "trainPeriod": null,
      "trainPeriodUnit": null,
      "trainDesc": null,
      "probationWorkMode": null,
      "probationWorkAddressRegionId": null,
      "probationWorkAddressRegionStr": null,
      "probationWorkAddressCityStr": null,
      "probationWorkAddressText": null,
      "probationWorkPeriod": null,
      "probationWorkPeriodUnit": null,
      "probationWorkAssessment": null,
      "probationWorkAssessmentText": null,
      "onWorkClothingDemand": null,
      "onWorkClothingExplain": "黑色裤子，黑色皮鞋、黑色袜子前四个月自备、后面门店可以提供",
      "onWorkInfo": "户口本、身份证、建行、毕业证书、健康证",
      "processDesc": "",
      "remark": "1、面试流程-面试前一天：当天14点，上传后台次日面试名单，逾期即报名下一轮面试\n2、面试当天：联系候选人确认到面情况\n3、面试次日：12:00前HR给到面试反馈\n4、面试一周内：追踪健康证及入职情况",
      "interviewExtLabel": "2,13,4,50"
    },
    "storeRequirement": {
      "id": 33172,
      "jobBasicInfoId": 33806,
      "jobName": "肯德基-刘洁区域-佘山宝地附近就近分配-储备经理-全职",
      "storeId": 307289,
      "storeName": "刘洁区域-佘山宝地附近就近分配",
      "storeAddress": null,
      "storeExactAddress": null,
      "newStore": null,
      "requirementNum": 1,
      "thresholdNum": 40,
      "interviewTimeMode": 2,
      "interviewAddressMode": 1,
      "secondInterviewAddressMode": null,
      "thirdInterviewAddressMode": null,
      "firstInterviewWay": 2,
      "secondInterviewWay": null,
      "thirdInterviewWay": null,
      "interviewTimes": [
        {
          "id": null,
          "interviewDate": null,
          "interviewTime": null,
          "interviewDateTime": null,
          "weekdays": [1],
          "start": null,
          "end": null,
          "times": [
            {
              "start": 52200,
              "end": 54000,
              "fixedDeadline": null,
              "cycleDeadlineDay": 0,
              "cycleDeadlineEnd": 43200
            }
          ]
        },
        {
          "id": null,
          "interviewDate": null,
          "interviewTime": null,
          "interviewDateTime": null,
          "weekdays": [3],
          "start": null,
          "end": null,
          "times": [
            {
              "start": 52200,
              "end": 54000,
              "fixedDeadline": null,
              "cycleDeadlineDay": 0,
              "cycleDeadlineEnd": 43200
            }
          ]
        }
      ],
      "interviewAddressRegionId": null,
      "interviewAddressRegionStr": null,
      "interviewAddressCityStr": null,
      "interviewAddressText": "电话面试 提前一天约面",
      "secondInterviewAddressText": null,
      "thirdInterviewAddressText": null,
      "probationWorkAddressMode": null,
      "probationWorkAddressRegionId": null,
      "probationWorkAddressRegionStr": null,
      "probationWorkAddressCityStr": null,
      "probationWorkAddressText": null,
      "trainAddressMode": null,
      "trainAddress": null
    },
    "company": {
      "id": 119,
      "name": "百胜中国控股有限公司",
      "bdUserId": 1,
      "bdName": null,
      "customerSuccessUserId": 360,
      "customerSuccessName": "高雅琪",
      "longitude": 121.440596,
      "latitude": 31.193039,
      "cityStr": "上海市",
      "regionStr": "徐汇区",
      "address": "上海市徐汇区美罗大厦天钥桥路30号",
      "detailedAddress": "1"
    },
    "store": {
      "id": 307289,
      "name": "刘洁区域-佘山宝地附近就近分配",
      "address": "上海市-松江区-佘月路27号一层105-107号肯德基(佘山宝地店)",
      "cityName": "上海市",
      "regionName": "松江区",
      "suspend": null,
      "exactAddress": "刘洁区域-佘山宝地附近就近分配\n上海市-松江区-佘月路27号一层105-107号肯德基(佘山宝地店)\n",
      "organizationId": 5,
      "organizationStr": "肯德基",
      "companyId": 119,
      "companyStr": null,
      "longitude": 121.230339,
      "latitude": 31.104254,
      "jobEnvImages": [],
      "insideImgKeyList": null,
      "doorImgKeyList": null,
      "aroundImgKeyList": null
    },
    "organization": {
      "name": "肯德基",
      "slogan": "你吃炸鸡我吃蛋挞好不好",
      "introduction": "主营业务：连锁快餐店\n品牌介绍：肯德基KFC坚持"立足中国、融入生活",打造新快餐,提供早餐,午餐,下午茶,晚餐,夜宵和甜品站等丰富选择。上海肯德基有限公司坚持以人为本，重视队伍建设和人才培养，已拥有一批专业的管理队伍和业务精英。我们热心公益，承担企业社会责任，履行企业公民职责，努力"用社会给予的关怀积极回馈社会"。",
      "oneSentenceIntro": "",
      "logo": "kendejilogo.png",
      "images": [
        "kendejishoutu.png",
        "kendejishoutu3.png",
        "kenduji1.png",
        "kendeji2.png"
      ]
    },
    "signUpNum": null,
    "changedFields": null,
    "canBeDeleted": 1,
    "thresholdExceed": false,
    "jobIndustry": "餐饮/快餐店"
  }
}
```

---

## 4 关键字段说明

### 4.1 basicInfo

| 字段              | 类型           | 说明                           |
| ----------------- | -------------- | ------------------------------ |
| id                | number         | 岗位 BasicInfoId               |
| parentId          | number \| null | 父岗位 ID                      |
| jobName           | string         | 岗位全称                       |
| jobNickName       | string         | 岗位简称                       |
| organizationId    | number         | 品牌 ID                        |
| organizationName  | string         | 品牌名称                       |
| jobId             | number         | 岗位唯一 ID                    |
| companyId         | number         | 公司 ID                        |
| companyName       | string         | 公司名称                       |
| companyAddress    | string         | 公司地址                       |
| jobType           | number         | 岗位类型 ID                    |
| jobTypeName       | string         | 岗位类型名称                   |
| cityIds           | number[]       | 城市 ID 数组                   |
| cityStrList       | string[]       | 工作城市                       |
| jobContent        | string         | 岗位职责描述                   |
| cooperationMode   | number         | 合作模式（2:小时工，3:全职等） |
| laborForm         | number         | 用工形式                       |
| haveProbation     | number \| null | 是否有试用期                   |
| needProbationWork | number         | 是否需要试岗（1:是，0:否）     |
| needTraining      | number         | 是否需要培训（1:是，0:否）     |
| status            | number         | 岗位状态                       |
| supportSupplier   | number         | 是否支持供应商（1:是，0:否）   |
| hidden            | boolean        | 是否隐藏                       |

### 4.2 salaryWelfare

#### 4.2.1 jobSalaries（薪资配置）

| 字段                      | 类型   | 说明                           |
| ------------------------- | ------ | ------------------------------ |
| id                        | number | 薪资配置 ID                    |
| jobBasicInfoId            | number | 关联岗位 ID                    |
| salaryPeriod              | number | 薪资周期（3:月薪）             |
| monthSalaryPeriodTime     | number | 月薪周期时间                   |
| weedSalaryPeriodTime      | number | 周薪周期时间                   |
| halfMonthSalaryPeriodTime | array  | 半月薪周期时间                 |
| salary                    | number | 基础薪资                       |
| salaryUnit                | number | 薪资单位（3:元/月，4:元/小时） |
| haveStairSalary           | number | 是否有阶梯薪资（1:有，2:无）   |
| holidaySalary             | number | 节假日薪资类型                 |
| holidaySalaryMultiple     | number | 节假日薪资倍数                 |
| holidayFixedSalary        | number | 节假日固定薪资                 |
| holidayFixedSalaryUnit    | number | 节假日固定薪资单位             |
| holidaySalaryDesc         | string | 节假日薪资描述                 |
| overtimeSalary            | number | 加班薪资类型                   |
| overtimeSalaryMultiple    | number | 加班薪资倍数                   |
| overtimeFixedSalary       | number | 加班固定薪资                   |
| overtimeFixedSalaryUnit   | number | 加班固定薪资单位               |
| overtimeSalaryDesc        | string | 加班薪资描述                   |
| commission                | number | 提成                           |
| attendenceSalary          | number | 出勤奖                         |
| performance               | string | 绩效奖金描述                   |
| attendenceSalaryUnit      | number | 出勤奖单位                     |
| minComprehensiveSalary    | number | 最低综合薪资                   |
| maxComprehensiveSalary    | number | 最高综合薪资                   |
| comprehensiveSalaryUnit   | number | 综合薪资单位                   |
| memo                      | string | 薪资备注                       |
| stairDescription          | string | 阶梯薪资描述                   |
| type                      | number | 薪资类型                       |
| jobSalaryStairs           | array  | 阶梯薪资配置                   |
| jobSalaryCustoms          | array  | 自定义薪资配置                 |

#### 4.2.2 jobProbationSalary（试用期薪资）

| 字段          | 类型     | 说明         |
| ------------- | -------- | ------------ |
| salary        | number   | 试用期薪资   |
| salaryUnit    | number   | 薪资单位     |
| noSalaryTypes | number[] | 免薪类型数组 |

#### 4.2.3 jobWelfare（福利待遇）

| 字段                                | 类型   | 说明                                 |
| ----------------------------------- | ------ | ------------------------------------ |
| id                                  | number | 福利配置 ID                          |
| jobBasicInfoId                      | number | 关联岗位 ID                          |
| haveInsurance                       | number | 是否有保险（0:无，1:有，2:特殊情况） |
| accommodation                       | number | 住宿情况（0:无，1:有）               |
| accommodationSalary                 | number | 住宿补贴                             |
| accommodationSalaryUnit             | number | 住宿补贴单位                         |
| probationAccommodationSalaryReceive | number | 试用期是否享受住宿补贴               |
| catering                            | number | 餐饮情况（0:无，1:有）               |
| cateringImage                       | string | 餐饮图片                             |
| cateringSalary                      | number | 餐饮补贴                             |
| cateringSalaryUnit                  | number | 餐饮补贴单位                         |
| trafficAllowanceSalary              | number | 交通补贴                             |
| trafficAllowanceSalaryUnit          | number | 交通补贴单位                         |
| otherWelfare                        | string | 其他福利                             |
| moreWelfares                        | array  | 更多福利列表                         |
| insuranceFund                       | array  | 保险基金类型数组                     |
| insuranceFundCityId                 | number | 保险基金城市 ID                      |
| insuranceFundCityStr                | string | 保险基金城市名称                     |
| insuranceFundAmount                 | number | 保险基金金额                         |
| memo                                | string | 福利备注说明                         |
| promotionWelfare                    | string | 晋升福利描述                         |
| accommodationNum                    | number | 住宿人数                             |
| commuteDistance                     | number | 通勤距离                             |
| accommodationEnv                    | string | 住宿环境描述                         |
| imagesDTOList                       | array  | 福利相关图片列表                     |

### 4.3 hiringRequirement（招聘要求）

| 字段                          | 类型        | 说明                   |
| ----------------------------- | ----------- | ---------------------- | -------------------- |
| id                            | number      | 招聘要求 ID            |
| figureId                      | number      | 身材要求 ID            |
| educationId                   | number      | 学历要求 ID            |
| genderIds                     | number[]    | 性别要求（1:男，2:女） |
| manMinHeight                  | number      | 男性最低身高           |
| manMaxHeight                  | number      | 男性最高身高           |
| manMinWeight                  | number      | 男性最低体重           |
| manMaxWeight                  | number      | 男性最高体重           |
| womanMinHeight                | number      | 女性最低身高           |
| womanMaxHeight                | number      | 女性最高身高           |
| womanMinWeight                | number      | 女性最低体重           |
| womanMaxWeight                | number      | 女性最高体重           |
| minAge                        | number      | 最低年龄               |
| maxAge                        | number      | 最高年龄               |
| nativePlaceRequirementType    | number      | 籍贯要求类型           |
| nativePlaceIds                | number[]    | 籍贯要求 ID 数组       |
| nativePlaceStrList            | string[] \\ | null                   | 籍贯要求字符串列表   |
| countryRequirementType        | number      | 国籍要求类型           |
| nationRequirementType         | number      | 民族要求类型           |
| nationIds                     | number[]    | 民族 ID 数组           |
| marriageBearingType           | number      | 婚育状况要求类型       |
| marriageBearingStatus         | string \\   | null                   | 婚育状况要求描述     |
| socialSecurityRequirementType | number      | 社保要求类型           |
| socialSecurityTypes           | number[]    | 社保类型数组           |
| workExperienceJobType         | number \\   | null                   | 工作经验岗位类型     |
| workExperienceJobTypeStr      | string \\   | null                   | 工作经验岗位类型描述 |
| minWorkTime                   | number \\   | null                   | 最少工作时间         |
| minWorkTimeUnit               | number \\   | null                   | 最少工作时间单位     |
| certificates                  | number[]    | 证件要求数组           |
| healthCertificateType         | number      | 健康证要求类型         |
| driverLicenseType             | number \\   | null                   | 驾驶证要求类型       |
| languages                     | number[]    | 语言要求数组           |
| languageRemark                | string \\   | null                   | 语言要求备注         |
| workingAttitude               | string \\   | null                   | 工作态度要求         |
| serviceAwareness              | string \\   | null                   | 服务意识要求         |
| affinity                      | string \\   | null                   | 亲和力要求           |
| extroversion                  | string \\   | null                   | 外向程度要求         |
| expression                    | string \\   | null                   | 表达能力要求         |
| appearance                    | string \\   | null                   | 外貌要求             |
| softSkill                     | string      | 软技能要求描述         |
| remark                        | string      | 招聘要求备注           |

### 4.4 workTimeArrangement（工作时间安排）

| 字段                         | 类型      | 说明                       |
| ---------------------------- | --------- | -------------------------- | -------------------- |
| id                           | number    | 工作时间安排 ID            |
| jobBasicInfoId               | number    | 关联岗位 ID                |
| employmentForm               | number    | 雇佣形式                   |
| minWorkMonths                | number    | 最少工作月数               |
| temporaryEmploymentStartTime | string \\ | null                       | 临时用工开始时间     |
| temporaryEmploymentEndTime   | string \\ | null                       | 临时用工结束时间     |
| employmentDescription        | string \\ | null                       | 用工描述             |
| monthWorkTimeRequirement     | number    | 月工时要求类型             |
| perMonthMinWorkTime          | number \\ | null                       | 每月最少工作时间     |
| perMonthMinWorkTimeUnit      | number \\ | null                       | 每月最少工作时间单位 |
| perMonthMaxRestTime          | number \\ | null                       | 每月最多休息时间     |
| perMonthMaxRestTimeUnit      | number \\ | null                       | 每月最多休息时间单位 |
| weekWorkTimeRequirement      | number    | 周工时要求类型             |
| perWeekNeedWorkDays          | number \\ | null                       | 每周需要工作天数     |
| perWeekWorkDays              | number    | 每周工作天数               |
| perWeekRestDays              | number    | 每周休息天数               |
| evenOddType                  | number \\ | null                       | 单双周类型           |
| customWorkTimes              | array \\  | null                       | 自定义工作时间       |
| dayWorkTimeRequirement       | number    | 日工时要求类型             |
| perDayMinWorkHours           | number    | 每日最少工作小时数         |
| arrangementType              | number    | 排班类型（1:固定，3:组合） |
| fixedArrangementTimes        | array \\  | null                       | 固定排班时间         |
| combinedArrangementTimes     | array \\  | null                       | 组合排班时间         |
| goToWorkStartTime            | number \\ | null                       | 上班开始时间         |
| goToWorkEndTime              | number \\ | null                       | 上班结束时间         |
| goOffWorkStartTime           | number \\ | null                       | 下班开始时间         |
| goOffWorkEndTime             | number \\ | null                       | 下班结束时间         |
| maxWorkTakingTime            | number    | 最大接单时间（分钟）       |
| restTimeDesc                 | string    | 休息时间描述               |
| workTimeRemark               | string    | 工时备注                   |

### 4.5 processRequirement（面试流程）

| 字段                          | 类型      | 说明           |
| ----------------------------- | --------- | -------------- | ------------------ |
| id                            | number    | 面试流程 ID    |
| jobBasicInfoId                | number    | 关联岗位 ID    |
| storeRelatedDemand            | number    | 门店相关需求   |
| interviewTotal                | number    | 面试轮次总数   |
| interviewMode                 | number \\ | null           | 面试模式           |
| interviewTimeMode             | number    | 面试时间模式   |
| firstInterviewWay             | number    | 第一轮面试方式 |
| secondInterviewWay            | number \\ | null           | 第二轮面试方式     |
| thirdInterviewWay             | number \\ | null           | 第三轮面试方式     |
| firstInterviewAddressMode     | number \\ | null           | 第一轮面试地址模式 |
| secondInterviewAddressMode    | number \\ | null           | 第二轮面试地址模式 |
| thirdInterviewAddressMode     | number \\ | null           | 第三轮面试地址模式 |
| interviewAddressRegionId      | number \\ | null           | 面试地址区域 ID    |
| interviewAddressRegionStr     | string \\ | null           | 面试地址区域名称   |
| interviewAddressCityStr       | string \\ | null           | 面试地址城市名称   |
| interviewAddressText          | string \\ | null           | 面试地址文本       |
| secondInterviewAddressText    | string \\ | null           | 第二轮面试地址文本 |
| thirdInterviewAddressText     | string \\ | null           | 第三轮面试地址文本 |
| interviewDemand               | string    | 面试要求说明   |
| secondInterviewDemand         | string \\ | null           | 第二轮面试要求说明 |
| thirdInterviewDemand          | string \\ | null           | 第三轮面试要求说明 |
| firstInterviewDesc            | string    | 第一轮面试描述 |
| secondInterviewDesc           | string \\ | null           | 第二轮面试描述     |
| thirdInterviewDesc            | string \\ | null           | 第三轮面试描述     |
| trainMode                     | number \\ | null           | 培训模式           |
| trainAddress                  | string \\ | null           | 培训地址           |
| trainPeriod                   | number \\ | null           | 培训周期           |
| trainPeriodUnit               | number \\ | null           | 培训周期单位       |
| trainDesc                     | string \\ | null           | 培训描述           |
| probationWorkMode             | number \\ | null           | 试岗模式           |
| probationWorkAddressRegionId  | number \\ | null           | 试岗地址区域 ID    |
| probationWorkAddressRegionStr | string \\ | null           | 试岗地址区域名称   |
| probationWorkAddressCityStr   | string \\ | null           | 试岗地址城市名称   |
| probationWorkAddressText      | string \\ | null           | 试岗地址文本       |
| probationWorkPeriod           | number \\ | null           | 试岗周期           |
| probationWorkPeriodUnit       | number \\ | null           | 试岗周期单位       |
| probationWorkAssessment       | number \\ | null           | 试岗考核           |
| probationWorkAssessmentText   | string \\ | null           | 试岗考核文本       |
| onWorkClothingDemand          | string \\ | null           | 上岗着装要求       |
| onWorkClothingExplain         | string    | 上岗着装说明   |
| onWorkInfo                    | string    | 上岗信息       |
| processDesc                   | string    | 流程描述       |
| remark                        | string    | 面试备注       |
| interviewExtLabel             | string    | 面试扩展标签   |

### 4.6 storeRequirement（门店需求）

| 字段                          | 类型      | 说明           |
| ----------------------------- | --------- | -------------- | ------------------ |
| id                            | number    | 门店需求 ID    |
| jobBasicInfoId                | number    | 关联岗位 ID    |
| jobName                       | string    | 岗位名称       |
| storeId                       | number    | 门店 ID        |
| storeName                     | string    | 门店名称       |
| storeAddress                  | string \\ | null           | 门店地址           |
| storeExactAddress             | string \\ | null           | 门店精确地址       |
| newStore                      | number \\ | null           | 是否新店           |
| requirementNum                | number    | 需求人数       |
| thresholdNum                  | number    | 门槛数量       |
| interviewTimeMode             | number    | 面试时间模式   |
| interviewAddressMode          | number    | 面试地址模式   |
| secondInterviewAddressMode    | number \\ | null           | 第二轮面试地址模式 |
| thirdInterviewAddressMode     | number \\ | null           | 第三轮面试地址模式 |
| firstInterviewWay             | number    | 第一轮面试方式 |
| secondInterviewWay            | number \\ | null           | 第二轮面试方式     |
| thirdInterviewWay             | number \\ | null           | 第三轮面试方式     |
| interviewTimes                | array     | 面试时间段配置 |
| interviewAddressRegionId      | number \\ | null           | 面试地址区域 ID    |
| interviewAddressRegionStr     | string \\ | null           | 面试地址区域名称   |
| interviewAddressCityStr       | string \\ | null           | 面试地址城市名称   |
| interviewAddressText          | string    | 面试地址文本   |
| secondInterviewAddressText    | string \\ | null           | 第二轮面试地址文本 |
| thirdInterviewAddressText     | string \\ | null           | 第三轮面试地址文本 |
| probationWorkAddressMode      | number \\ | null           | 试岗地址模式       |
| probationWorkAddressRegionId  | number \\ | null           | 试岗地址区域 ID    |
| probationWorkAddressRegionStr | string \\ | null           | 试岗地址区域名称   |
| probationWorkAddressCityStr   | string \\ | null           | 试岗地址城市名称   |
| probationWorkAddressText      | string \\ | null           | 试岗地址文本       |
| trainAddressMode              | number \\ | null           | 培训地址模式       |
| trainAddress                  | string \\ | null           | 培训地址           |

### 4.7 company / store / organization

#### company（公司信息）

| 字段                  | 类型      | 说明         |
| --------------------- | --------- | ------------ | ----------- |
| id                    | number    | 公司 ID      |
| name                  | string    | 公司名称     |
| bdUserId              | number    | BD 用户 ID   |
| bdName                | string \\ | null         | BD 用户名称 |
| customerSuccessUserId | number    | 客成用户 ID  |
| customerSuccessName   | string    | 客成用户名称 |
| longitude             | number    | 公司经度     |
| latitude              | number    | 公司纬度     |
| cityStr               | string    | 公司所在城市 |
| regionStr             | string    | 公司所在区域 |
| address               | string    | 公司地址     |
| detailedAddress       | string    | 公司详细地址 |

#### store（门店信息）

| 字段             | 类型      | 说明         |
| ---------------- | --------- | ------------ | ------------ |
| id               | number    | 门店 ID      |
| name             | string    | 门店名称     |
| address          | string    | 门店地址     |
| cityName         | string    | 门店所在城市 |
| regionName       | string    | 门店所在区域 |
| suspend          | number \\ | null         | 是否暂停     |
| exactAddress     | string    | 门店精确地址 |
| organizationId   | number    | 品牌 ID      |
| organizationStr  | string    | 品牌名称     |
| companyId        | number    | 公司 ID      |
| companyStr       | string \\ | null         | 公司名称     |
| longitude        | number    | 门店经度     |
| latitude         | number    | 门店纬度     |
| jobEnvImages     | array     | 工作环境图片 |
| insideImgKeyList | array \\  | null         | 室内图片列表 |
| doorImgKeyList   | array \\  | null         | 门口图片列表 |
| aroundImgKeyList | array \\  | null         | 周边图片列表 |

#### organization（品牌信息）

| 字段             | 类型   | 说明         |
| ---------------- | ------ | ------------ |
| name             | string | 品牌名称     |
| slogan           | string | 品牌口号     |
| introduction     | string | 品牌介绍     |
| oneSentenceIntro | string | 一句话介绍   |
| logo             | string | 品牌 Logo    |
| images           | array  | 品牌图片列表 |

---

## 5 错误码（同上接口）

| code | message      | 说明                   |
| ---- | ------------ | ---------------------- |
| 0    | 操作成功     | 请求成功               |
| 1001 | 无效 Token   | 请重新登录获取新 Token |
| 2001 | 参数校验失败 | 检查必填字段           |

---

## 6 枚举值映射表

### 6.1 关键枚举值说明

#### salaryUnit（薪资单位）

- `3`: 元/月
- `4`: 元/小时

#### cooperationMode（合作模式）

- `2`: 小时工/兼职
- `3`: 全职

#### haveInsurance（保险状态）

- `0`: 无保险
- `1`: 有保险
- `2`: 特殊情况

#### arrangementType（排班类型）

- `1`: 固定排班
- `3`: 组合排班

#### haveStairSalary（是否有阶梯薪资）

- `1`: 有阶梯薪资
- `2`: 无阶梯薪资

#### genderIds（性别要求）

- `1`: 男
- `2`: 女

#### laborForm（用工形式）

- `2`: 正式工
- `5`: 兼职

#### salaryPeriod（薪资周期）

- `3`: 月薪

#### weekWorkTimeRequirement（周工时要求类型）

- `2`: 指定周工作天数
- `3`: 指定周工作时长

#### dayWorkTimeRequirement（日工时要求类型）

- `1`: 指定日最少工作小时数

#### firstInterviewWay（第一轮面试方式）

- `1`: 线下面试
- `2`: 线上面试

### 6.2 时间格式说明

#### 时间戳格式

API 中的时间字段使用**秒数**表示一天中的时间：

- `startTime: 18000` = 5:00 AM (18000 ÷ 3600 = 5 小时)
- `endTime: 50400` = 2:00 PM (50400 ÷ 3600 = 14 小时)

#### 星期映射

- `0`: 周日
- `1`: 周一
- `2`: 周二
- `3`: 周三
- `4`: 周四
- `5`: 周五
- `6`: 周六

---

## 7 变更记录

| 版本 | 日期       | 说明                                                       |
| ---- | ---------- | ---------------------------------------------------------- |
| v1.0 | 2025-06-27 | 首次整理岗位详情接口                                       |
| v1.1 | 2025-06-30 | 根据真实生产数据更新完整字段结构，修正枚举值，补充缺失字段 |
