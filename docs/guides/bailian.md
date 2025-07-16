# 上传本地文件获取临时公网 URL

在调用多模态、图像、视频或音频模型时，通常需要传入文件的公网 URL。为此，阿里云百炼提供了免费临时存储空间，您可将本地文件上传至该空间并获得公网 URL（有效期为 48 小时）。

## 使用限制

- **文件与模型绑定**：文件上传时必须指定模型名称，且该模型须与后续调用的模型一致，不同模型无法共享文件。此外，不同模型对文件大小有不同限制，超出限制将导致上传失败。
- **文件与主账号绑定**：文件上传与模型调用所使用的 API Key 必须属于同一个阿里云主账号，且上传的文件仅限该主账号及其对应模型使用，无法被其他主账号或其他模型共享。
- **文件有效期限制**：文件上传后有效期 48 小时，超时后文件将被自动清理，请确保在有效期内完成模型调用。
- **文件使用限制**：文件一旦上传，不可查询、修改或下载，仅能通过 URL 参数在模型调用时使用。
- **文件上传限流**：文件上传凭证接口的调用限流为指定模型调用限流的 10 倍，超出限流将导致请求失败。

> **重要**
> 临时公网 URL 仅适用于测试阶段，请勿在生产环境中使用。
>
> 在生产环境中，建议使用长期有效的 URL，例如将文件存储在阿里云 OSS 中，以确保文件的稳定性和持久性。

## 快速获取文件 URL（推荐）

本文提供 Python 示例代码，将上传本地文件至临时空间并获取 URL 的三步操作简化为一步。

### 前提条件

在调用前，您需要获取 API Key，再配置 API Key 到环境变量。

### 示例代码

**Python**

#### 环境配置

推荐使用 Python 3.8 及以上版本。

请安装必要的依赖包。

```bash
pip install -U requests
```

#### 输入参数

- `api_key`：阿里云百炼 API KEY。
- `model_name`：上传文件时需指定调用的模型名称，如 `qwen-vl-plus`。
- `file_path`：待上传的本地文件路径（图片、视频等）。

```python
import os
import requests
from pathlib import Path
from datetime import datetime, timedelta

def get_upload_policy(api_key, model_name):
    \"\"\"获取文件上传凭证\"\"\"
    url = "https://dashscope.aliyuncs.com/api/v1/uploads"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    params = {
        "action": "getPolicy",
        "model": model_name
    }

    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        raise Exception(f"Failed to get upload policy: {response.text}")

    return response.json()['data']

def upload_file_to_oss(policy_data, file_path):
    \"\"\"将文件上传到临时存储 OSS\"\"\"
    file_name = Path(file_path).name
    key = f"{policy_data['upload_dir']}/{file_name}"

    with open(file_path, 'rb') as file:
        files = {
            'OSSAccessKeyId': (None, policy_data['oss_access_key_id']),
            'Signature': (None, policy_data['signature']),
            'policy': (None, policy_data['policy']),
            'x-oss-object-acl': (None, policy_data['x_oss_object_acl']),
            'x-oss-forbid-overwrite': (None, policy_data['x_oss_forbid_overwrite']),
            'key': (None, key),
            'success_action_status': (None, '200'),
            'file': (file_name, file)
        }

        response = requests.post(policy_data['upload_host'], files=files)
        if response.status_code != 200:
            raise Exception(f"Failed to upload file: {response.text}")

    return f"oss://{key}"

def upload_file_and_get_url(api_key, model_name, file_path):
    \"\"\"上传文件并获取公网 URL\"\"\"
    # 1. 获取上传凭证
    policy_data = get_upload_policy(api_key, model_name)
    # 2. 上传文件到 OSS
    oss_url = upload_file_to_oss(policy_data, file_path)

    return oss_url
```

#### 使用示例

```python
if __name__ == "__main__":
    # 从环境变量中获取 API Key 或者 在代码中设置 api_key = "your_api_key"
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise Exception("请设置 DASHSCOPE_API_KEY 环境变量")

    # 设置model名称
    model_name="qwen-vl-plus"

    # 待上传的文件路径
    file_path = "/tmp/cat.png"  # 替换为实际文件路径

    try:
        public_url = upload_file_and_get_url(api_key, model_name, file_path)
        expire_time = datetime.now() + timedelta(hours=48)
        print(f"文件上传成功，有效期为48小时，过期时间: {expire_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"公网URL: {public_url}")

    except Exception as e:
        print(f"Error: {str(e)}")
```

#### 输出示例

```
文件上传成功，有效期为 48 小时，过期时间: 2024-07-18 17:36:15
公网 URL: oss://dashscope-instant/xxx/2024-07-18/xxx/cat.png
```

## 获取文件 URL（详细步骤）

### 步骤 1：获取文件上传凭证

#### 前提条件

您需要已获取 API Key 并配置 API Key 到环境变量。

#### 请求接口

`GET https://dashscope.aliyuncs.com/api/v1/uploads`

#### 入参描述

| 传参方式 | 字段          | 类型   | 必选 | 描述                                        | 示例值             |
| :------- | :------------ | :----- | :--- | :------------------------------------------ | :----------------- |
| Header   | Content-Type  | string | 是   | 请求类型：`application/json`。              | `application/json` |
| Header   | Authorization | string | 是   | 阿里云百炼 API Key，例如：`Bearer sk-xxx`。 | `Bearer sk-xxx`    |
| Params   | action        | string | 是   | 操作类型，当前场景为 `getPolicy`。          | `getPolicy`        |
| Params   | model         | string | 是   | 需要调用的模型名称。                        | `qwen-vl-plus`     |

#### 出参描述

| 字段                          | 类型   | 描述                                                                 | 示例值                                                   |
| :---------------------------- | :----- | :------------------------------------------------------------------- | :------------------------------------------------------- |
| `request_id`                  | string | 本次请求的系统唯一码。                                               | `7574ee8f-...-11c33ab46e51`                              |
| `data`                        | object | -                                                                    | -                                                        |
| `data.policy`                 | string | 上传凭证。                                                           | `eyJl...1ZSJ9XX0=`                                       |
| `data.signature`              | string | 上传凭证的签名。                                                     | `g5K...d40=`                                             |
| `data.upload_dir`             | string | 上传文件的目录。                                                     | `dashscope-instant/xxx/2024-07-18/xxxx`                  |
| `data.upload_host`            | string | 上传的 host 地址。                                                   | `https://dashscope-file-xxx.oss-cn-beijing.aliyuncs.com` |
| `data.expire_in_seconds`      | string | 凭证有效期（单位：秒）。过期后，重新调用本接口获取新的凭证。         | `300`                                                    |
| `data.max_file_size_mb`       | string | 本次允许上传的最大文件的大小（单位：MB）。该值与需要访问的模型相关。 | `100`                                                    |
| `data.capacity_limit_mb`      | string | 同一个主账号每天上传容量限制（单位：MB）。                           | `999999999`                                              |
| `data.oss_access_key_id`      | string | 用于上传的 access key。                                              | `LTAxxx`                                                 |
| `data.x_oss_object_acl`       | string | 上传文件的访问权限，`private` 表示私有。                             | `private`                                                |
| `data.x_oss_forbid_overwrite` | string | 文件同名时是否可以覆盖，`true` 表示不可覆盖。                        | `true`                                                   |

#### 请求示例

```bash
curl --location 'https://dashscope.aliyuncs.com/api/v1/uploads?action=getPolicy&model=qwen-vl-plus' \\
--header "Authorization: Bearer $DASHSCOPE_API_KEY" \\
--header 'Content-Type: application/json'
# 若未配置阿里云百炼API Key到环境变量，请将$DASHSCOPE_API_KEY 替换为实际 API Key，例如：--header "Authorization: Bearer sk-xxx"。
```

#### 响应示例

```json
{
  "request_id": "52f4383a-c67d-9f8c-xxxxxx",
  "data": {
    "policy": "eyJl...1ZSJ=",
    "signature": "eWy...=",
    "upload_dir": "dashscope-instant/xxx/2024-07-18/xxx",
    "upload_host": "https://dashscope-file-xxx.oss-cn-beijing.aliyuncs.com",
    "expire_in_seconds": 300,
    "max_file_size_mb": 100,
    "capacity_limit_mb": 999999999,
    "oss_access_key_id": "LTA...",
    "x_oss_object_acl": "private",
    "x_oss_forbid_overwrite": "true"
  }
}
```

### 步骤 2：上传文件至临时存储空间

#### 前提条件

- 已获取文件上传凭证。
- 确保文件上传凭证在有效期内，若凭证过期，请重新调用步骤 1 的接口获取新的凭证。（查看文件上传凭证有效期：步骤 1 的输出参数 `data.expire_in_seconds` 为凭证有效期，单位为秒。）

#### 请求接口

`POST {data.upload_host}`
（请将`{data.upload_host}`替换为步骤 1 的输出参数 `data.upload_host` 对应的值。）

#### 入参描述

| 传参方式    | 字段                     | 类型   | 必选 | 描述                                                                                                                                                                                                                             | 示例值                                         |
| :---------- | :----------------------- | :----- | :--- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| Header      | Content-Type             | string | 否   | 提交表单必须为 `multipart/form-data`。在提交表单时，Content-Type 会以 `multipart/form-data;boundary=xxxxxx` 的形式展示。`boundary` 是自动生成的随机字符串，无需手动指定。若使用 SDK 拼接表单，SDK 也会自动生成该随机值。         | `multipart/form-data; boundary=9431149156168`  |
| `form-data` | `OSSAccessKeyId`         | text   | 是   | 文件上传凭证接口的输出参数 `data.oss_access_key_id` 的值。                                                                                                                                                                       | `LTAm5xxx`                                     |
| `form-data` | `policy`                 | text   | 是   | 文件上传凭证接口的输出参数 `data.policy` 的值。                                                                                                                                                                                  | `g5K...d40=`                                   |
| `form-data` | `Signature`              | text   | 是   | 文件上传凭证接口的输出参数 `data.signature` 的值。                                                                                                                                                                               | `Sm/tv7DcZuTZftFVvt5yOoSETsc=`                 |
| `form-data` | `key`                    | text   | 是   | 文件上传凭证接口的输出参数 `data.upload_dir` 的值拼接上`/文件名`。例如，`upload_dir` 为 `dashscope-instant/xxx/2024-07-18/xxx`，需要上传的文件名为 `cat.png`，拼接后的完整路径为：`dashscope-instant/xxx/2024-07-18/xxx/cat.png` | `dashscope-instant/xxx/2024-07-18/xxx/cat.png` |
| `form-data` | `x-oss-object-acl`       | text   | 是   | 文件上传凭证接口的输出参数 `data.x_oss_object_acl` 的值。                                                                                                                                                                        | `private`                                      |
| `form-data` | `x-oss-forbid-overwrite` | text   | 是   | 文件上传凭证接口的输出参数中 `data.x_oss_forbid_overwrite` 的值。                                                                                                                                                                | `true`                                         |
| `form-data` | `success_action_status`  | text   | 否   | 通常取值为 `200`，上传完成后接口返回 HTTP code `200`，表示操作成功。                                                                                                                                                             | `200`                                          |
| `form-data` | `file`                   | text   | 是   | 文件或文本内容。一次只支持上传一个文件。`file` 必须为最后一个表单域，除 `file` 以外的其他表单域并无顺序要求。例如，待上传文件 `cat.png` 在 Linux 系统中的存储路径为`/tmp`，则此处应为 `file=@\"/tmp/cat.png\"`。                 | `@\"/tmp/cat.png\"`                            |

#### 出参描述

调用成功时，本接口无任何参数输出。

#### 请求示例

```bash
curl --location 'https://dashscope-file-xxx.oss-cn-beijing.aliyuncs.com' \\
--form 'OSSAccessKeyId="LTAm5xxx"' \\
--form 'Signature="Sm/tv7DcZuTZftFVvt5yOoSETsc="' \\
--form 'policy="eyJleHBpcmF0aW9 ... ... ... dHJ1ZSJ9XX0="' \\
--form 'x-oss-object-acl="private"' \\
--form 'x-oss-forbid-overwrite="true"' \\
--form 'key="dashscope-instant/xxx/2024-07-18/xxx/cat.png"' \\
--form 'success_action_status="200"' \\
--form 'file=@"/tmp/cat.png"'
```

### 步骤 3：生成文件 URL

文件 URL 拼接逻辑：`oss://` + `key` （步骤 2 的入参 `key`）。该 URL 有效期为 48 小时。

`oss://dashscope-instant/xxx/2024-07-18/xxxx/cat.png`

### 验证：使用 URL 进行模型调用

#### 前提条件

- 文件 URL 仍在上传后的 48 小时有效期内。
- 模型调用与文件上传凭证中使用的模型必须保持一致。
- 模型调用的 API KEY 需与文件上传凭证中的 API KEY 同属一个阿里云主账号，不可使用其他账号的 API KEY 调用模型。

#### 使用 URL 进行模型调用

上文已通过 `qwen-vl-plus` 模型上传示例图片并获取临时公网 URL。接下来，调用该模型，传入图片 URL，完成图片理解任务。

![image](https://cdn.example.com/image_placeholder.png)

#### 请求示例

图片 URL 使用临时公网 URL，设置为：`{"url": "oss://dashscope-instant/xxx/2024-07-18/xxxx/cat.png"}`。

```bash
curl -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \\
-H "Authorization: Bearer $DASHSCOPE_API_KEY" \\
-H 'Content-Type: application/json' \\
-H 'X-DashScope-OssResourceResolve: enable' \\
-d '{
"model": "qwen-vl-plus",
"messages": [{
"role": "user",
"content":
[{"type": "text","text": "这是什么"},
{"type": "image_url","image_url": {"url": "oss://dashscope-instant/xxx/2024-07-18/xxxx/cat.png"}}]\
}]
}\'
```

> **重要**
> 在调用模型时，若使用临时存储空间中的文件，必须在 Header 中添加参数 `X-DashScope-OssResourceResolve: enable`，否则将报错。

#### 响应示例

```json
{
  "choices": [
    {
      "message": {
        "content": "这是一张描绘一只白色猫咪在草地上奔跑的图片。这只猫有蓝色的眼睛，看起来非常可爱和活泼。背景是模糊化的自然景色，强调了主体——那只向前冲跑的小猫。这种摄影技巧称为浅景深（或大光圈效果），它使得前景中的小猫变得清晰而锐利，同时使背景虚化以突出主题并营造出一种梦幻般的效果。整体上这张照片给人一种轻松愉快的感觉，并且很好地捕捉到了动物的行为瞬间。",
        "role": "assistant"
      },
      "finish_reason": "stop",
      "index": 0,
      "logprobs": null
    }
  ],
  "object": "chat.completion",
  "usage": {
    "prompt_tokens": 1253,
    "completion_tokens": 104,
    "total_tokens": 1357
  },
  "created": 1739349052,
  "system_fingerprint": null,
  "model": "qwen-vl-plus",
  "id": "chatcmpl-cfc4f2aa-22a8-9a94-8243-44c5bd9899bc"
}
```
