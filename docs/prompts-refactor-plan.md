# 提示词与品牌数据本地化重构计划

> **目标**：将项目中所有硬编码的提示词 (System Prompts, Reply Prompts) 和品牌数据 (`sample-data.ts`) 迁移到浏览器本地存储 (`localforage`)，并创建一个统一的可视化管理后台，实现配置与代码的完全分离。
>
> **最终效果**：运营人员或开发者可以在一个后台页面上动态修改所有对话逻辑和招聘信息，无需改动代码即可生效。
>
> **规则**：配置即数据 · 关注点分离 · `localforage` 优先 · 每阶段可独立验证

---

## 🗂️ 最终目录结构（目标状态）

```
app/
  admin/
    settings/
      page.tsx                    # 统一配置管理页面 (The new UI)
      components/
        brand-data-editor.tsx     # 品牌数据编辑器
        prompts-editor.tsx        # 各类提示词编辑器
lib/
  services/
    config.service.ts           # 核心服务：封装 localforage 读写逻辑
  hooks/
    useConfigManager.ts         # React Hook：连接UI与配置服务
  loaders/
    zhipin-data.loader.ts       # 重构后的数据加载器，从 config.service 读取
    system-prompts.loader.ts    # 重构后的提示词加载器
types/
  config.d.ts                   # 存放品牌数据、提示词等统一的类型定义
scripts/
  migrate-to-localstorage.ts    # 【一次性】迁移脚本：将文件数据写入 localforage
```

---

## 🚧 分阶段实施计划

**重要提示**：Agent 将严格按照以下阶段顺序执行。每个阶段完成后，**Agent 会暂停执行**，等待您的确认和测试。只有在您确认当前阶段没有问题后，才会继续执行下一阶段。

### Phase-0：准备工作

1.  **创建计划文件**: 新建本文件 `docs/prompts-refactor-plan.md`，作为后续所有步骤的唯一行动指南。 (✅ 已完成)
2.  **检查依赖**: 确认 `localforage` 已作为项目依赖。 (经检查 `docs/BRAND_PERSISTENCE.md`，已存在)
3.  **创建开发分支**: Agent 将基于 `main` 分支创建 `feature/config-localization` 分支来隔离开发过程。

### Phase-1：创建统一配置服务

| Task                    | 目标文件                         | 关键点                                                                                                                                                                                                   |
| ----------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. **定义数据类型**     | `types/config.d.ts`              | 从 `sample-data.ts` 和 `zhipin-data-loader.ts` 抽离，定义 `BrandData` 和 `PromptsData` 的 TypeScript 接口，作为统一的数据结构标准。                                                                      |
| 2. **封装 LocalForage** | `lib/services/config.service.ts` | 创建一个服务模块，封装所有 `localforage` 操作。提供 `getConfig()` 和 `saveConfig(data)` 等异步方法，并定义唯一的存储 `key` (例如 `APP_CONFIG_DATA`)，所有数据将存储在此单一 key 下，便于管理和未来同步。 |

### Phase-2：数据迁移与加载逻辑重构

1.  **创建一次性迁移脚本**: 在 `scripts/migrate-to-localstorage.ts` 中编写迁移逻辑。

    - 该脚本会 `import` 所有旧的数据文件 (`sample-data.ts`, `system-prompts.ts` 等)。
    - 将数据聚合成符合 `types/config.d.ts` 中定义的统一结构。
    - 调用 `config.service.ts` 中的 `saveConfig` 方法，将数据一次性写入 `localforage`。
    - 此脚本需要在应用启动时或通过手动命令执行一次。

2.  **重构数据加载器**:
    - 修改 `lib/utils/zhipin-data-loader.ts` (将重命名为 `lib/loaders/zhipin-data.loader.ts`) 和 `lib/system-prompts.ts` (将重命名为 `lib/loaders/system-prompts.loader.ts`)。
    - 将所有硬编码的提示词和数据读取逻辑，全部改为从 `config.service.ts` 中异步获取。

> ⏸️ **用户确认点 #1**
>
> 此阶段完成后，应用的功能和表现应与重构前完全一致，但所有数据都已从 `localforage` 加载。旧的数据文件此时尚未删除。
> **Agent 将在此暂停，待您确认核心业务流程（如智能回复）无误后，再进行下一步。**

### Phase-3：构建可视化配置后台

| Task                  | 目标文件                         | 关键点                                                                                                                                                                                   |
| --------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. **创建页面和布局** | `app/admin/settings/page.tsx`    | 创建一个新的路由页面。使用 Tab 或 Accordion 控件，将配置项分为 "品牌与门店"、"系统级提示词"、"智能回复指令" 等几个清晰的模块。                                                           |
| 2. **开发编辑器组件** | `app/admin/settings/components/` | - `brand-data-editor.tsx`: 使用 JSON 编辑器组件（如 `@uiw/react-json-view` 或简单的 `<textarea>`) 来展示和修改品牌数据。 <br> - `prompts-editor.tsx`: 为每个提示词提供独立的表单输入框。 |
| 3. **创建交互 Hook**  | `lib/hooks/useConfigManager.ts`  | 创建此 Hook 来处理：<br> 1. 从 `config.service` 异步加载配置到页面状态。 <br> 2. 提供 `updateConfig` 方法，让编辑器组件调用，将修改后的数据保存回 `localforage`。                        |

### Phase-4：测试与收尾

1.  **端到端测试**:
    - 在 `/admin/settings` 页面修改一个话术模板（例如 `salary_inquiry`）。
    - 保存更改。
    - 回到主应用或测试页面 `/test-llm-reply`，触发相应场景（如询问薪资），验证返回的回复是否为新修改的话术。
    - 测试修改门店信息、系统提示词等，确保所有更改都能实时生效。
2.  **代码清理**:
    - 确认所有功能正常后，安全删除 `lib/data/sample-data.ts` 和其他已被迁移的旧数据文件。
    - 删除或归档一次性迁移脚本 `scripts/migrate-to-localstorage.ts`。

> 🏁 **最终用户验收**
>
> 这是最后一个开发阶段。完成后，整个重构计划即告完成。
> **Agent 将在此暂停，待您进行最终的全面验收。**

---

## 📝 备注

- **数据原子性**: 所有配置保存在一个 `localforage` 条目下，便于未来作为一个整体与云端同步。
- **编辑器选择**: 初期为快速实现，品牌数据等复杂 JSON 结构可使用文本编辑器。未来可迭代为更精细化的表单界面。
- **本地存储限制**: 当前方案数据存储在用户本地浏览器，无法跨设备同步。这是为未来实现云同步功能（可选）所做的设计铺垫。

---

✅ **完成此计划后，项目将拥有一个灵活、强大的动态配置中心，极大提升运营效率和迭代速度，同时为未来的云端同步功能奠定了坚实的基础。**
