## API 获取品牌在招岗位列表

```bash
curl -X POST https://k8s.duliday.com/persistence/a/job-requirement/hiring/list/v2 \
     -H "Content-Type: application/json" \
     -H "duliday-token: DULIDAY_TOKEN" \
     -d '{"organizationIds": [865],"pageNum": 0,"pageSize": 10}'
```

### API 响应数据

响应数据结构请参考：[@job-requirement-hiring-list-v2.json](../sample-data/job-requirement-hiring-list-v2.json)

## API 根据`jobBasicInfoId`获取在招岗位详情

```bash
curl -X GET "https://k8s.duliday.com/persistence/a/job/getJobStoreByJobBasicInfoId?jobBasicInfoId=31605" \
     -H "duliday-token: DULIDAY_TOKEN"
```

### API 响应数据

响应数据结构请参考：[@get-jobStore-by-jobBasicInfo-id.json](../sample-data/get-jobStore-by-jobBasicInfo-id.json)

## API 根据`jobId`预约面试

```bash
curl -X POST "https://k8s.duliday.com/persistence/a/supplier/entryUser" \
 -H "Content-Type: application/json" \
 -H "duliday-token: 5D5FF5C9262AA637BE7A9E8B413B9D01A571B49BBC53056550DF105F686CECB4774B129445F4DFD6B59BBA89B813CB556515B40BE4957EFB1BA841D003C0FEB61F9CDAE3DF3723C643C9CD169E77DD70E05D498E471E1C13" \
 -d '{
"name": "李青",
"age": "39",
"phone": "13585516989",
"genderId": 1,
"educationId": 10,
"hasHealthCertificate": 1,
"interviewTime": "2025-07-22 13:00:00",
"customerLabelList": [],
"jobId": 523302,
"operateType": 3
}'
```

### 响应数据

1. 成功

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "notice": "已发送消息告知项目经理：吴越，如有问题渠道运营会联系您",
    "errorList": null
  }
}
```

2. 异常

```json
{
  "code": 30003,
  "message": "您已为用户报名该岗位",
  "data": null
}
```

```json
{ "code": 10000, "message": "姓名不能为空", "data": null }
```

```json
{ "code": 10000, "message": "联系电话不能为空", "data": null }
```

```json
{ "code": 10000, "message": "岗位不能为空", "data": null }
```

```json
{ "code": 10000, "message": "岗位不存在或已下架", "data": null }
```

3. 服务器内部错误
   • 类型错误/格式错误: code: 50000, message: "麻麻呀，服务器暂时跑丢了～"
   • 当 genderId 传入字符串而非数字时
   • 当 interviewTime 格式错误时
