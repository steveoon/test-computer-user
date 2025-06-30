# 群机器人配置说明

> 最后更新：2025/06/04

## 如何使用群机器人

在终端某个群组添加机器人之后，创建者可以在机器人详情页看到该机器人特有的 webhookurl。开发者可以按以下说明向这个地址发起 HTTP POST 请求，即可实现给该群组发送消息。下面举个简单的例子.

假设 webhook 是：`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=693a91f6-7xxx-4bc4-97a0-0ec2sifa5aaa`

> **特别特别要注意**：一定要保护好机器人的 webhook 地址，避免泄漏！不要分享到 github、博客等可被公开查阅的地方，否则坏人就可以用你的机器人来发垃圾消息了。

以下是用 `curl` 工具往群组推送文本消息的示例（注意要将 url 替换成你的机器人 webhook 地址，content 必须是 utf8 编码）：

```shell
curl 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=693axxx6-7aoc-4bc4-97a0-0ec2sifa5aaa' \
   -H 'Content-Type: application/json' \
   -d '
   {
        "msgtype": "text",
        "text": {
            "content": "hello world"
        }
   }'
```

当前自定义机器人支持文本（text）、markdown（markdown、markdown_v2）、图片（image）、图文（news）、文件（file）、语音（voice）、模板卡片（template_card）八种消息类型。
机器人的 `text/markdown` 类型消息支持在 `content` 中使用`<@userid>`扩展语法来@群成员（`markdown_v2` 类型消息不支持该扩展语法）

## 消息类型及数据格式

### 文本类型

```json
{
  "msgtype": "text",
  "text": {
    "content": "广州今日天气：29度，大部分多云，降雨概率：60%",
    "mentioned_list": ["wangqing", "@all"],
    "mentioned_mobile_list": ["13800001111", "@all"]
  }
}
```

| 参数                    | 是否必填 | 说明                                                                                                                             |
| :---------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `msgtype`               | 是       | 消息类型，此时固定为 `text`                                                                                                      |
| `content`               | 是       | 文本内容，最长不超过 2048 个字节，必须是 utf8 编码                                                                               |
| `mentioned_list`        | 否       | userid 的列表，提醒群中的指定成员(@某个成员)，`@all` 表示提醒所有人，如果开发者获取不到 userid，可以使用 `mentioned_mobile_list` |
| `mentioned_mobile_list` | 否       | 手机号列表，提醒手机号对应的群成员(@某个成员)，`@all` 表示提醒所有人                                                             |

### markdown 类型

```json
{
  "msgtype": "markdown",
  "markdown": {
    "content": "实时新增用户反馈<font color=\"warning\">132例</font>，请相关同事注意。\n>类型:<font color=\"comment\">用户反馈</font>\n>普通用户反馈:<font color=\"comment\">117例</font>\n>VIP用户反馈:<font color=\"comment\">15例</font>"
  }
}
```

| 参数      | 是否必填 | 说明                                                    |
| :-------- | :------- | :------------------------------------------------------ |
| `msgtype` | 是       | 消息类型，此时固定为 `markdown`                         |
| `content` | 是       | markdown 内容，最长不超过 4096 个字节，必须是 utf8 编码 |

### markdown_v2 类型

````json
{
  "msgtype": "markdown_v2",
  "markdown_v2": {
    "content": "# 一、标题\n## 二级标题\n### 三级标题\n# 二、字体\n*斜体*\n\n**加粗**\n# 三、列表 \n- 无序列表 1 \n- 无序列表 2\n  - 无序列表 2.1\n  - 无序列表 2.2\n1. 有序列表 1\n2. 有序列表 2\n# 四、引用\n> 一级引用\n>>二级引用\n>>>三级引用\n# 五、链接\n[这是一个链接](https:work.weixin.qq.com/api/doc)\n![](https://res.mail.qq.com/node/ww/wwopenmng/images/independent/doc/test_pic_msg1.png)\n# 六、分割线\n\n---\n# 七、代码\n`这是行内代码`\n```\n这是独立代码块\n```\n\n# 八、表格\n| 姓名 | 文化衫尺寸 | 收货地址 |\n| :----- | :----: | -------: |\n| 张三 | S | 广州 |\n| 李四 | L | 深圳 |\n"
  }
}
````

| 参数      | 是否必填 | 说明                                                           |
| :-------- | :------- | :------------------------------------------------------------- |
| `msgtype` | 是       | 消息类型，此时固定为 `markdown_v2`。                           |
| `content` | 是       | `markdown_v2` 内容，最长不超过 4096 个字节，必须是 utf8 编码。 |

> **特殊的：**
>
> 1. `markdown_v2` 不支持字体颜色、@群成员的语法， 具体支持的语法可参考下面说明
> 2. 消息内容在客户端 4.1.36 版本以下(安卓端为 4.1.38 以下) 消息表现为纯文本，建议使用最新客户端版本体验

### 图片类型

```json
{
  "msgtype": "image",
  "image": {
    "base64": "DATA",
    "md5": "MD5"
  }
}
```

| 参数      | 是否必填 | 说明                               |
| :-------- | :------- | :--------------------------------- |
| `msgtype` | 是       | 消息类型，此时固定为 `image`       |
| `base64`  | 是       | 图片内容的 base64 编码             |
| `md5`     | 是       | 图片内容（base64 编码前）的 md5 值 |

> **注**：图片（base64 编码前）最大不能超过 2M，支持 JPG,PNG 格式

### 图文类型

```json
{
  "msgtype": "news",
  "news": {
    "articles": [
      {
        "title": "中秋节礼品领取",
        "description": "今年中秋节公司有豪礼相送",
        "url": "www.qq.com",
        "picurl": "https://res.mail.qq.com/node/ww/wwopenmng/images/independent/doc/test_pic_msg1.png"
      }
    ]
  }
}
```

| 参数          | 是否必填 | 说明                                                                              |
| :------------ | :------- | :-------------------------------------------------------------------------------- |
| `msgtype`     | 是       | 消息类型，此时固定为 `news`                                                       |
| `articles`    | 是       | 图文消息，一个图文消息支持 1 到 8 条图文                                          |
| `title`       | 是       | 标题，不超过 128 个字节，超过会自动截断                                           |
| `description` | 否       | 描述，不超过 512 个字节，超过会自动截断                                           |
| `url`         | 是       | 点击后跳转的链接。                                                                |
| `picurl`      | 否       | 图文消息的图片链接，支持 JPG、PNG 格式，较好的效果为大图 1068*455，小图 150*150。 |

### 文件类型

```json
{
  "msgtype": "file",
  "file": {
    "media_id": "3a8asd892asd8asd"
  }
}
```

| 参数       | 是否必填 | 说明                                |
| :--------- | :------- | :---------------------------------- |
| `msgtype`  | 是       | 消息类型，此时固定为 `file`         |
| `media_id` | 是       | 文件 id，通过下文的文件上传接口获取 |

### 语音类型

```json
{
  "msgtype": "voice",
  "voice": {
    "media_id": "MEDIA_ID"
  }
}
```

| 参数       | 是否必填 | 说明                                    |
| :--------- | :------- | :-------------------------------------- |
| `msgtype`  | 是       | 语音类型，此时固定为 `voice`            |
| `media_id` | 是       | 语音文件 id，通过下文的文件上传接口获取 |

## 消息发送频率限制

每个机器人发送的消息不能超过 20 条/分钟。
