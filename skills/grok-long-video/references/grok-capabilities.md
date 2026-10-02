# Grok 能力档：v0.1 · 核验日 2026-10-02

目录：证据层级；模式与限制；参考绑定；请求示例；渠道降级；声音与恢复。

## 1. 把三种事实分开

- `documented`：官方文件描述支持。本文数值属于这一层，不代表当前账户已接通。
- `user_reported`：用户提供的渠道限制或使用观察；保留来源，待实际请求验证，不自动升级为已接通。
- `adapter_verified`：当前平台/适配器确实编译并发送了该字段，有脱敏请求证据。
- `visually_accepted`：真实视频及用户评审证明它在某个任务范围内可用。

不要用后一层的单例推导所有任务都可靠，也不要用前一层冒充实际生成成功。记录 `provider / endpoint / model_id / adapter_version / checked_at / evidence`。换渠道、换端点、换版本时重新判断；同一渠道内不同模式也可能使用不同模型。

本文针对官方 API 的 `grok-imagine-video-1.5`，不是旧的语言模型 Grok-1.5。官方模型页列有 preview 和日期别名，生产记录保留真实返回的模型标识。引用 [E1]。

## 2. 模式与限制

以下为简要事实摘要；正式请求以当前官方文档和实际 schema 为准。所有与能力有关的 workflow 建议都是本套 skill 的设计判断，须实测。

| 路径 | 核心输入/端点 | 官方边界 | 实际应用边界 |
|---|---|---|---|
| 文生视频 | `/v1/videos/generations`，`prompt` | 1–15s；480p/720p/1080p [E2] | 不假定会返回或暴露内部中间图 |
| 单图图生视频 | `image` | 1.5 可原生1080p；默认随输入比例 [E3] | 明确指定不同画幅可能拉伸原图；先准备目标比例的图 |
| 参考生成 | `reference_images`，可加 `reference_audios` | 图片最多7张、最高720p [E4] | 参考图本身不是首帧；数量上限不是建议填满 |
| 首帧＋参考 | `image`＋参考 | 1.5 支持；归入参考生成 [E3,E4] | 上限720p；不能继续按纯 i2v 的1080p计划 |
| 首尾帧 | `image`＋`last_frame`；也可只给尾帧 | 1.5 支持，可与参考组合 [E4] | 视为参考路径，按720p规划；实际输出仍检查端点 |
| 内部关键帧 | `keyframes: [{image,timestamp_s}]` | 最多4个，严格在(0,duration)内；1/3秒网格；同槽冲突拒绝 [E4] | 显式用合法网格，排序、留运动时间；不与编辑混用 |
| 原生延长 | `/v1/videos/extensions`＋`video` | 源2–15s；新增2–10s；返完整片；最高720p [E5] | 示例模型是经典 `grok-imagine-video`；单独核验1.5可用性 |
| 原生编辑 | `/v1/videos/edits`＋`video` | 源≤8.7s；时长/比例继承；最高720p [E6] | 示例模型同为经典版本；不能假定是逐帧局部遮罩修复 |

延长/编辑使用 MP4 与受支持编码；不发送自定义比例和分辨率字段，编辑不发送自定义时长。延长的 `duration` 指新增部分，不是完整返回片的总时长。[E5,E6]

用户提供“延长源≤50MB”：在查阅的延长指南中未找到这一通用限制，保留为 `user_reported_channel_limit=50MB`，仅在目标渠道核验后用于该渠道；不要混同 Files API 的公开 URL 大小限制。MB/MiB 及上传路径也分别记录。

官方当前说明经典 `grok-imagine-video` 不支持1.5的首尾/内部帧固定与首帧参考组合；不得用经典版本示例给1.5高级生成模式做映射。反过来也不得将1.5高级帧能力塞进经典编辑/延长请求。[E2,E4]

## 3. 图像和声音的引用绑定

无首帧时，第一张参考用 `<IMAGE_0>`；有 `image` 时它占 `<IMAGE_0>`，独立参考从 `<IMAGE_1>` 起。预设声音用 `<AUDIO_0>`、`<AUDIO_1>`、`<AUDIO_2>`。[E4]

建立本地 `ReferenceBinding`，列出角色/道具/场景/风格、资产版本、provider槽位、prompt标签、负责什么以及不负责什么。不能把另一模型的 `<Audio N>`、`@图N` 或1起始编号直接搬来；内部键帧使用时间字段，不猜测未记录的prompt编号。

1.5 普通账户的声音参考是最多3个 `voice_id` 预设嗓音；自有声音文件需要合作方权限。它不能直接等同于任意音频波形复用或背景音乐接续。[E4]

原生生成默认带音轨，静音生成使用已支持的 `generate_audio=false`。[E2] “无音乐”提示词只是内容引导；没有确认专用控制字段时不得虚构 `disable_music`。原生声音实际保留与否由成片检查决定。

## 4. 官方 REST 请求示例

以下均是请求构造示例，不是已执行任务。占位资源必须替换成可用输入，并核验当前账户和适配器。不要把内部 ShotPlan JSON 全部当作 API body。

```json
{
  "model": "grok-imagine-video-1.5",
  "prompt": "Continue the motion from <IMAGE_0>. Keep the identity and outfit of <IMAGE_1>. The otter walks screen-right toward the doorway and stops before opening it. One continuous shot, steady lateral tracking.",
  "image": {"url": "<APPROVED_REAL_TAIL_URL>"},
  "reference_images": [{"url": "<APPROVED_LOOK_URL>"}],
  "duration": 6,
  "resolution": "720p",
  "aspect_ratio": "16:9",
  "generate_audio": false
}
```

这是原生首帧＋Look，不是把尾帧和Look都放进reference数组。若前镜尾帧已经换脸，先修上游或改变剪辑关系，不能靠Look在第0帧同时恢复另一个身份。

```json
{
  "model": "grok-imagine-video-1.5",
  "prompt": "The lantern is lifted gradually, held steady, then placed on the marked shelf. Continuous physically plausible motion between the pinned frames, no cut.",
  "image": {"url": "<APPROVED_START_URL>"},
  "last_frame": {"url": "<APPROVED_END_URL>"},
  "keyframes": [
    {"image": {"url": "<MIDSTATE_1_URL>"}, "timestamp_s": 2.0},
    {"image": {"url": "<MIDSTATE_2_URL>"}, "timestamp_s": 4.0}
  ],
  "reference_images": [{"url": "<APPROVED_LOOK_URL>"}],
  "duration": 6,
  "resolution": "720p",
  "aspect_ratio": "16:9"
}
```

第二例展示合法字段组合，不建议每镜都用两端加两关键帧。先验证各帧身份、场景、尺度和动作能连接，不能用帧固定要求模型实现不可能的运动。Python SDK 的字段名与 REST 不完全相同，例如 `last_frame_url` 和内部帧 `timestamp`；按所用 SDK 当前 schema 转换，不混写。[E4]

## 5. 适配器预检和降级

1. 先列此任务需要的能力，读取 `CapabilityProfile` 和真实编译请求。
2. 检查字段数、模式组合、输入格式、画幅、时长、内部帧时间、标签顺序、源片长度和字节数。
3. 不支持高级组合时显式降级：原生首帧＋Look → 外部生图融合并审核新首帧 → 单图i2v；或按叙事使用正常切镜/reference重新建立。记录连续性语义和分辨率的变化。
4. 不支持延长时选真实尾帧＋Look的分段生成；不支持编辑时选剪辑、局部窗口重生或根帧重建。不能悄悄丢弃字段还报告原路径成功。
5. `seed / fps / negative_prompt` 没有在本次所查官方生成指南中确认可设置；默认 `unverified`，不发送。不支持时记录 `seed=null`，候选按request_id区分；成片帧率属于后期输出，不反填为模型设置。
6. 图像输入官方可用HTTPS、data URI或Files `file_id` [E3,E4]；第三方可能仅URL。优先保存资产字节和来源版本，分发URL可更换；不得用重新绘图代替保真转存。

## 6. 异步任务与声音策略

提交与轮询分开，立即持久化 `request_id`、脱敏body/hash、父资产版本；完成后检查视频文件、流和视觉。生成输出URL可能临时有效，及时收货；能用当前平台持久化能力时保留文件ID。[E2,E7,E8]

声音策略由项目选择：`native_reviewed`（审核后保留原生声音）、`external_master`（统一旁白/对白、配乐、环境轨）、`hybrid`（选择可用原生音效，另做全片声音）。角色声线、台词准确性、音乐连续性单独验收。外部 TTS 或配音不是自动精准唇形同步；根据任务决定独立lip-sync、重生、避开正面说话特写或采用旁白。

## 7. 一手来源索引

这些来源支持能力参数，不支持“Grok必定更好”或本套新流程的成功率承诺。访问日均为2026-10-02。

- [E1 模型身份](https://docs.x.ai/developers/models/grok-imagine-video-1.5)
- [E2 生成、分辨率、声音及异步流程](https://docs.x.ai/developers/model-capabilities/video/generation)
- [E3 图生视频与组合语义](https://docs.x.ai/developers/model-capabilities/video/image-to-video)
- [E4 参考、首尾、内部帧及声音](https://docs.x.ai/developers/model-capabilities/video/reference-to-video)
- [E5 延长](https://docs.x.ai/developers/model-capabilities/video/extension)
- [E6 编辑](https://docs.x.ai/developers/model-capabilities/video/editing)
- [E7 REST端点](https://docs.x.ai/developers/rest-api-reference/inference/videos)
- [E8 生成结果持久化](https://docs.x.ai/developers/model-capabilities/imagine/files/outputs)

## 8. 待实测的关键假设

原生首帧＋Look是否比融合首帧更稳；内部帧是否改善动作顺序而引入停顿；经典延长是否改变1.5原片画风；编辑能否保住未要求修改的身份；多图对当前场景是帮助还是拉回旧空间。逐项保留失败例，不能凭接口支持宣称已经解决。
