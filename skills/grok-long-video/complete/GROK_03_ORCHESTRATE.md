---
name: grok-video-orchestrate
description: 统筹 Grok 长视频项目从全片规划、首次生成、审片、大小偏离修复到选片和成片交付的闭环。用户要求完整项目、整合生成与修复方法、持续测试或把已验证配方迁入现有 Agent 系统时使用；通过 GLV/1.0 调用 grok-long-video-create 与 grok-video-repair，不替代现有 canonical、专业Agent和成片工具。
---

# Grok 长视频闭环编排

执行版本 v0.1；只协调任务和证据，不建立新canonical、不改用户现有可视化工作流。

## 1. 装载同一版本的规则

读 [共享协议](#glv-shared)、[能力档](#glv-capabilities)；计划实测/更新时读 [评测与迭代](#glv-method)。按registry名称解析 `$grok-long-video-create` 与 `$grok-video-repair`，记录版本和加载依据。

三份skill既可由一个执行Agent顺序加载，也可绑定现有专业Agent。不要把本文件等同六Agent全新流程，不增加Agent或工具权限，不变更zcode正在执行的前端任务。

输入用户简报/反馈、项目快照、批准资源、当前模型能力、已生成视频与实际记录。输出ProjectPlan、TaskLedger、候选/选片清单、RepairTickets、AssemblyManifest、审片材料和真实状态结论。

缺视频调用能力时先完成计划与交接文件，标明等待执行；缺视频/仓库时不确认模型实测成功、Skill正式加载或canonical替换。

## 2. 单次运行固定基线

固定本次 `project revision / story / anchors / selected videos / skill version / capability profile / adapter version`。执行中可以新增候选；改变故事、锚点或skill时生成新快照/新run，不把修改前后拼成一个冻结盲测。

运行台账记录每单元目标、上下游、负责人/skill、输入依据、task/request ID、状态、候选和下一步。Agent对话是说明，不是完成证据。

费用不作为机械限制；根据用户已说明的token plan与当前授权持续完成必要候选和修复。尊重实际模式限制和用户已有审片/选片权，不新建每次调用都要询问的审批流程。

## 3. 以叙事和风险组织生产

调用首次生成skill先做完整故事段、起终态、锚点与ShotPlan。采用混合策略：可自主表现的段落给Grok适当空间，身份/道具/因果/接缝关键点用更强视觉条件。

让同一生成单元承载它能清楚表达的beats，按复杂度决定长度。既不强迫全部逐镜静图流水线，也不强迫全部长镜头原生延长；哪条路径更稳由本账户实测决定。

先做信息量高的样片验证锚点与模式，再铺开。每次只推进依赖已满足的分支；独立镜头/同父版本的候选可并行，正式下游必须绑定明确父版本。

组内动作连续时逐镜判断是否接续；身份不足时再锚定。新组首镜单独判断，允许正常切镜和独立建立。故事段数量与镜头数量不被skill固定。

## 4. 使用闭环，而不是一次性批量

按 `规划 → 生成候选 → 质检/用户反馈 → 保留或修复 → 正式选片 → 依赖复核 → 成片` 推进。

生成skill提供首尾状态与缺陷；修复skill查最早根点、分类大/小偏离并提出候选；需要根帧重建则交回首次生成。三者传递同一GLV对象和资产版本，不复制失真的摘要。

对正常且合格的镜头立即标keep，集中处理repair/uncertain。不因为报告要“全部方法覆盖”而把桥接、关键帧、编辑全部硬塞进作品。

对于用户反馈先区分喜欢/不喜欢、明确技术缺陷、接受剧情变化、正式选片。尊重主观审美反馈，不能以自动评分驳回用户；但它不能自动改写资源身份或剧情结局。

## 5. 处理修复循环和停滞

每次修复明确假设、可改变项、需要保留项和回归条件。候选同类失败反复出现时提升诊断层级：输入绑定→根图→模式/动作设计→模型局限，不只延长prompt。

小偏离优先最小有效操作；大偏离从最早错误依据重建必要范围。用户未决定的重大故事/选片问题提交可比较结果等待；不依赖该决定的准备、诊断和其他镜头继续推进。

没有新证据且连续尝试不改善时返回有界备选：保留可接受偏差、换切镜/构图、缩短/拆动作、独立建立或提供用户选择。不要把“无限生成”当稳定性方案，也不要设覆盖全项目的三次上限。

## 6. 收货、恢复和选择版本

提交后持久化ID再轮询；失败或turn中断后按台账核对已有任务，复用ID收货。提交响应丢失时标 `submission_unknown`，依据平台查询/日志确认，不能直接重新提交宣称无重复。

区分参数/素材失败、已提交轮询失败、输出下载失败、视觉失败与Agent回复中断。429/临时故障遵循当前平台退避规则；不能重发错误参数撞400。重试是台账事件，保留父版本，不覆盖新候选。

正式选片通过项目入口/OCC执行；选定新视频后提取对应真实尾帧。仅以它作首帧的后续需要重新判定；reference依赖复核；独立镜头保留。过期任务返回只成为旧basis的候选，不能写当前canonical。

## 7. 成片交接与声音

将准确版本的AssemblyManifest交现有成片Agent/工具：镜头顺序、入出点、实际时长、转场与重叠、旁白/对白、音乐和音效来源、字幕、输出规格。

统一工作规格不等于生成全部最高分辨率。原生首帧参考等路径最高720p，纯i2v/t2v可1080p；混合项目通常先统一720p工作档，必要时后期升级。禁止将超分文件记成模型原生1080p。

根据项目采用native_reviewed、external_master或hybrid；检查跨镜声线、完整台词、背景音乐连续和音画同步。声音失败优先修声音轨，不无故重生合格画面；需要改唇形/动作同步时明确额外视觉步骤。

extend的完整返回含输入内容，时间线保留所需新增区间，避免源片重复；窗口重生和桥接要计入真实长度。技术导出成功后再通看片：叙事/节奏、一致性/物理、声音/接缝；可根据项目合并审查，但不能只看导出状态。

最终提供可播放粗剪、逐镜候选/选片、主要修复前后对比、剩余问题。用户最终定版按项目已有规则；不要以推荐成片冒充final_render已批准。

## 8. 测试和经验沉淀

首次测试冻结 v0.1；在不同故事与多个难度上观察。保留模型、方法、适配器、素材、用户评价，不能把效果差异单独归因“先规划”。需要因果判断时用匹配任务和控制变量。

旧项目修复证明集成，不计独立盲测。新会话新故事让执行者自行选路径，不给逐镜答案。记录规则实际加载、事前决策、工具轨迹与视频结果三类证据。

每条经验先记 `observation → hypothesis → limited_recipe → broader_rule`，附适用条件/反例。单例成功只进入有限配方；稳定复现后才改默认规则。参数改能力档，项目评语留项目档案，流程规则改相应skill，避免三处复制互相冲突。

## 9. 可诚实宣告的完成状态

报告 `plan_only / producing / awaiting_user_review / repair_needed / draft_ready / final_approved` 之一，附真实证据。

“本轮已完成”要求授权范围内必要工作做完、可播放材料齐全、问题有明确归因、正式依赖一致；“此Grok方法稳定”还要求冻结新会话迁移测试与用户观看支持。文档结构检查通过不等于模型质量封板。


---

<a id="glv-shared"></a>

# 附录A：共享协议

# 共享协议 GLV/1.0 · 配套 skills v0.1

目录：事实层；叙事层级；输入输出；连续性路径；偏离判断；状态和依赖；交接；质检。

## 1. 唯一事实与职责

使用项目原有 canonical、revision/OCC、ownership、锁、receipt 和选片工具；本协议只是便于交接的概念字段，不要求改数据库或建立第二份canonical。字段名按仓库实际映射。没有这些工具的独立测试，用版本化JSON/文件清单模拟，并标注为本地记录。

故事与资源状态取自批准版本；候选中的偶然事件不能自动改写故事。用户“喜欢这个视频”、审核通过、正式选入时间线和最终成片定版是不同动作，分别留证据。

一名Agent也能按顺序加载三个skill；skill不是新Agent，也不是独立运行任务。若系统已有专业Agent，沿正式委派入口交接。不要为加载本套skill增加Agent数量。

## 2. 叙事与生成层级

| 对象 | 定义 | 约束 |
|---|---|---|
| Project | 完整作品与成片目标 | 目标时长、风格、画幅、质量条件 |
| Group | 相对完整的故事段或动作过程 | 不按固定镜头数切组 |
| Shot | 电影语言中的一镜及其叙事作用 | 有起态、终态、镜头和剪辑关系 |
| GenerationUnit | 一次模型生成的片段 | 可覆盖一镜、同镜一部分，或经验证的数个beats |
| Beat | 可观察的动作/叙事变化 | 时间提示是计划，非精确执行保证 |
| CandidateVersion | 一次真实返回的素材版本 | 不等于已选素材 |

默认先规划全片，再选择生成单元；不把每个beat都拆成一次请求，也不把整个Group硬塞进15秒。一个镜头可由多个单元构成；请求里“无切镜”和“多个机位切镜”不能同时成立。

## 3. 核心交接对象

以下字段是内部概念契约，不能原样发送给provider。实现可简化，但必须保留同等语义。

```json
{
  "schema": "GLV/1.0",
  "project_id": "P001",
  "run_id": "R001",
  "revision_basis": "project-r12",
  "skill_version": "v0.1",
  "capability_profile_id": "cap-accountA-adapter3-20261002",
  "brief": {
    "target_duration_s": 60,
    "aspect_ratio": "16:9",
    "working_resolution": "720p",
    "audio_strategy": "external_master"
  },
  "shots": [{
    "group_id": "G02",
    "shot_id": "G02-S03",
    "generation_unit_id": "U08",
    "planned_duration_s": 6,
    "story_goal": "带灯抵达门前，不开门",
    "start_state": {"door": "closed", "lantern": "unlit", "holder": "CHAR_A"},
    "end_state_required": {"door": "closed", "lantern": "unlit", "location": "doorway"},
    "camera": {"size": "medium", "angle": "eye_level", "move": "lateral_track"},
    "anchors": ["LOOK_A@3", "PROP_LAMP@2", "LOC_HUT@1", "STYLE@2"],
    "route": "native_first_plus_refs",
    "continuity_requirement": "same_motion",
    "parents": [{"asset_id": "V07", "version": 2, "relation": "first_frame_from_real_tail"}],
    "reference_bindings": [
      {"asset_id": "TAIL_V07@2", "role": "first_frame", "provider_field": "image", "prompt_tag": "<IMAGE_0>"},
      {"asset_id": "LOOK_A@3", "role": "identity", "provider_field": "reference_images[0]", "prompt_tag": "<IMAGE_1>"}
    ],
    "decision_before_submit": "同一动作继续，上游尾帧身份正确；当前组合路径已接通",
    "request_id": null,
    "candidate_ids": [],
    "selected_version": null
  }]
}
```

另外保存以下四类对象：

- `CapabilityProfile`：每路径的实际model/endpoint、文档状态、适配器验证、视觉范围、输入组合和限制、证据；未知值不能写true。
- `GenerationReceipt`：候选ID、提交时间、request_id、compiled request/hash、返回model、来源资产版本、下载后的hash/规格、实际音轨、状态。脱敏，不存可公开的密钥。
- `RepairTicket`：预期/实际差异、首个坏点、问题区间、根因假设和置信度、严重度、影响范围、冻结项、允许改变项、所选修法、候选和回归结果。
- `AssemblyManifest`：准确选片版本、in/out的实际时间戳、时间线顺序、重叠/转场、声音来源、输出规格、审片状态。预计总时长要扣除重叠，不能加总完整延长返回片造成重复。

## 4. 连续性路径的固定语义

| route | 真实输入及起点 | 合理用途 |
|---|---|---|
| `independent_t2v` | 文字，自行建立开头 | 新场景、氛围或身份要求低的镜头 |
| `approved_frame_i2v` | 审核图 → image | 已设计好构图/身份的独立镜头 |
| `real_tail_i2v` | 选定父版本真实尾帧 → image | 清晰正确尾帧的同动作继续 |
| `native_first_plus_refs` | 正确尾帧或审核首帧 → image，Look等 → refs | 兼顾起点与身份；须组合能力可用 |
| `fused_new_first` | Look＋场景/尾帧 → 外部新图 → image | 需要重建首图或渠道不支持组合；起点已经改变 |
| `reference_reestablish` | Look等 → refs，自行决定首帧 | 新机位、换场、身份再建立；不声称硬接 |
| `first_last_generate` | 两端图 → image/last_frame | 两端合格且中间可实现的过渡 |
| `timed_keyframe_generate` | 合格内部帧与时间，可含两端/refs | 动作阶段控制；并不证明所有运动都自然 |
| `native_extend` | 选定视频/合法上下文窗口 → video | 同镜继续；返回包含上下文的完整视频 |
| `native_edit` | 选定短视频 → edit端点 | 已有动作值得保留、编辑字段确实可用的改动 |
| `editorial_cut` | 两段各自合格，直接剪辑连接 | 正常电影切镜，不要求邻帧像素相似 |

所有“硬首帧”措辞指provider明确接收了固定首帧条件；它不是实际输出无需检查的保证。原生1.5帧固定的官方语义与输出转码后的可见结果分别记录。

## 5. 大小偏离：严重度与修复范围分开

严重度：`A/blocking`（故事因果、角色身份、关键道具或运动严重错误）；`B/important`（明显风格、运镜、节奏等偏差）；`C/acceptable`（可接受且不影响理解的小瑕疵）。

范围：`local`（只在短区间/单局部）、`shot`（整镜）、`root_or_chain`（根资产或下游链）。别用坏帧比例定义严重度：半秒换脸可以A；整镜轻微偏暖可以B或C。

执行选择：

- **可接受偏差**：质检确认不影响硬条件，记录并保留。
- **小偏离修补**：根依据正确，核心故事、身份、空间和多数素材可保留，有可界定缺陷；选择最小能通过的修法。局部A问题也可能只需局部修补，但必须修到通过。
- **大偏离重建**：根帧/身份依据/场景状态已错、叙事因果错误、全镜持续漂移、动作不可实现，或局部修补无法保住硬条件；从最早错误依据重建必要范围。
- **证据不足**：暂停相关分支，先查原图、真实帧、请求与版本；不能默认全部重生。

## 6. 候选、依赖与 freshness

任务状态建议映射为：`planned → submitted → pending → received → reviewed → candidate_ready`。独立记录 `selected / rejected / accepted_with_deviation`；被替换父版本的子候选用 `needs_review` 或 `stale` 标记。`received`不能直接变`selected`。

每个从视频提取的帧保存：父视频ID和version/hash、解码时间戳、帧索引、最后实际可解码帧/选定剪辑出点、提取工具信息、图像hash、用途。不是目录里叫tail.png的最新文件就可靠。

区分：视频末尾真实帧、剪辑出点帧、另取的末段较清晰帧、模型生成的终态设计图。若改用较早清晰帧，必须同步剪掉原镜后面的内容，或承认产生了一次切镜；不继续宣称从原真实尾帧接续。

正式选片变化后按真实依赖图处理：

| 变化 | 处理 |
|---|---|
| 子镜image来自旧尾帧 | 标 stale，重新判断/生成；旧尾帧不能被覆盖 |
| 仅reference引用旧父版本 | 标 needs_review；看实际关系是否仍可用 |
| 独立切镜、无真实父依赖 | 保留，复核相邻接缝和叙事状态 |
| 时间线/音频依赖被替换区间 | 复核时长、字幕、配音、音乐与同步 |
| 父只是提出新候选，尚未选用 | 不改变正式时间线和子镜依据 |

按拓扑顺序修必要下游；不能看到“上游改了”就全部重生成。并发任务只允许无未决上游依赖的候选；正式写入遵守锁/OCC，过期返回不覆盖新版本。

## 7. SkillHandoff

生成发现偏差交修复；修复需要重建交首次生成；两者都交编排收口。传递同一对象ID和快照，不复制另一套事实。

```json
{
  "schema": "GLV/1.0",
  "from_skill": "grok-long-video-create",
  "to_skill": "grok-video-repair",
  "run_id": "R001",
  "basis_revision": "project-r12",
  "input_refs": ["ShotPlan:U08@1", "Candidate:C08B@1", "Review:QC08B@1"],
  "affected_units": ["U08"],
  "frozen_assets": ["LOOK_A@3", "PROP_LAMP@2"],
  "allowed_changes": ["repair candidate U08; retain story goal"],
  "required_return": ["RepairTicket", "candidate versions", "regression", "dependencies to review"],
  "task_state": "candidate_ready_for_diagnosis"
}
```

在registry按frontmatter名称解析另外两个skill；不要依赖某个本机绝对路径或安装后可能被改名的兄弟文件夹。缺失时保留handoff，指出缺少的skill，继续不依赖它的工作；不能凭空声称已经加载或委派。

## 8. 质量门槛与停止条件

用蓝本15维检查：语义、角色、场景、光照、运动、镜头、画质、连续性、节奏、转场、声音、风格、情绪、主体完整、物理环境。再加故事起终态、参考实际绑定、版本/依赖、全片声音连续性。

观看整段，首帧/中间/末尾抽样辅助定位；快动作、变形点、接缝两侧提高检查密度。自动视觉评分只能筛查，不能以均分覆盖A问题，不能用截图通过代表整段通过。

用三份独立结论：请求合法与成功；制作决策是否合理；视频是否可接受。若只缺用户审美/剧情/正式选片决定，提交可播放、可比较材料，等待该决定；其他可独立完成项继续推进。

连续若干次同类失败触发诊断，不设全项目三次硬上限；诊断实验尽量一次改一个变量，生产级重构可同时改必要条件，但要列清改动，不宣称完成单变量因果验证。



---

<a id="glv-capabilities"></a>

# 附录B：能力档

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



---

<a id="glv-method"></a>

# 附录C：评测与迭代

# Grok 技能评测与迭代 · v0.1

目录：评测边界；干运行情景；真机优先项；盲测任务；对照与指标；升级规则。

## 1. 分开三种通过

`structural_pass`：frontmatter、链接、协议版本、路径/字段规则和handoff自洽。

`decision_pass`：执行者能在题目里自主选合理路径、守边界、保留版本。

`visual_pass`：真实provider请求、回执、视频整段和用户观看支持。

前两项不能冒充第三项。没有Grok调用时只做前两项，报告未跑视频。不要为了方法列表“全绿”把没用途能力硬塞入正片。

## 2. 不生成视频也要能答对的情景

| 输入情景 | 检查行为 |
|---|---|
| 正确清晰尾帧，同动作继续 | 区分首帧与refs，合理比较i2v和原生组合 |
| 远景尾帧身份不足，下一镜近景 | 查批准Look、风险再锚定、允许重构起点 |
| 尾帧人物明确错误 | 不拿错误帧硬接且同时声称第0帧正确 |
| 新组换时间/地点，两个独立好镜头 | 不默认桥接 |
| 两端合格，但缺必要动作 | 比较剪辑/过渡/桥接，保可播放对照 |
| 原生首帧＋Look要求1080p | 指出参考组合720p限制，提供显式取舍 |
| keyframes在0/终点或同时间槽 | 改用端点字段或合法网格，不发送冲突 |
| 12秒完整片要edit | 不直接送≤8.7s端点；判断截窗/重生 |
| extend输入18秒 | 不送完整片，判断合法末段窗口/其他路径 |
| extend返回包括源片 | 时间线不重复源内容，核实真实新增区间 |
| 只有一个瞬间换脸 | A/local，不均分通过；不自动全片重做 |
| 全镜色温略漂 | 检查可接受性/后期，不因全镜受影响即重根 |
| adapter未开放首帧＋refs | 不静默丢字段；明确降级语义 |
| 正确Look在auto绑定中消失 | 查compiled request，先修输入工程 |
| 上游正式换版，但子镜仍指旧tail | 依赖分类；硬首帧stale、refs复核、独立镜保留 |
| 上游只提出新候选，尚未选片 | 不修改正式下游和时间线 |
| 响应丢失/轮询中断 | 标不明或按已存ID恢复，不盲目重发 |
| 用户说“这条好看” | 不等同正式选片或接受剧情变化 |

执行者输出路径、依据、能力状态、实际输入槽、可改变范围、依赖处理和下一步；不是只选一条字符串。

## 3. 首轮真机优先项

第一轮先用最影响长视频稳定性的4类任务：

1. **远景→近景身份**：正确尾帧、Look一致，比较纯尾帧、原生首帧＋Look、融合新首帧。允许重新构图的路线单列剪辑目标。
2. **道具交互与终态**：提灯/放灯/不开门等明确状态，比较文字引导与少量内部帧；检查完整动作及固定帧附近。
3. **小偏离修补**：真实坏窗口有合格双端，比较后期、短片编辑或窗口重生，统计冻结项退化。
4. **大偏离重建**：真实根图有错，执行者先修根再生成，并正确处理一个硬依赖子镜和一个独立镜头。

随后再测跨空间、原生延长画风、滚动窗口、桥接和声音。优先级来自用户当前目标，不是所有接口必须先覆盖。

各路线若可行，先用多个独立候选观察；建议起步每条件3次，重要决策增加样本，不把3次写成统计显著保证。费用不是主要门槛，限制来自信息量、实际队列及用户观看负担。

## 4. 全新故事盲测简报

给另一个执行会话以下简报，不给逐镜方法答案；本套skills和当前工具/模型能力必须可读。无视频工具时完成plan_only并明确未执行。

```text
使用当前正式Grok视频skills，制作约60秒二维手绘短片《纸鸢回站》。
主角是一只穿绿色外套、系米色围巾的小狐狸，解剖右耳有缺口；重要道具为带红线轴的蓝色纸鸢。
故事：雨后站台找回纸鸢，进入修理棚修好骨架，带到山坡重新放飞。人物、道具和故事结局应稳定；有远近景变化、同动作继续及合理换场。镜头数量与模型路径由你规划。
先建立或核对批准素材和当前能力，完成可播放候选与粗剪。保留事前决策、请求和版本、问题与修复。不要修改无关项目、旧片或其他模型的skill。
最终给出候选、修复前后、真实状态和需要我审片选片的事项。
```

这份任务的用于生产的锚点仍需按项目规则成为批准资产，简报文字本身不是已存在的Look图。

旧项目用于回归根帧、终态、freshness和选片；不计独立迁移盲测。冻结版本修改后开新run复验。

## 5. 对照实验的公平性

分开两类比较：同条件比较方法的因果；各模型采用适合它的最佳流程比较最终工程效果。后者有实际价值，但不能把所有差异归因于规划或某一参考。

固定或明确记录：故事目标、硬条件、批准资源、模型/端点/账号、工作规格、模式、候选预算/耗时、prompt版本、选片标准。记录随机候选分布，不只展示最好的一条。

不支持seed时以request_id和素材hash追踪，不能声称精确重现同一画面。同一seed即使支持也不等于跨版本、跨模式和跨模型同随机条件。

## 6. 记录少数有用指标

| 指标 | 定义与用途 |
|---|---|
| 身份/道具/终态通过 | 分项硬条件，不被总均分掩盖 |
| 首轮可接受率 | 首轮候选中可保留者/所有首轮候选；保失败分母 |
| 修复成功率 | 原问题消失且冻结项通过的修复/所有尝试 |
| 修复副作用 | 新产生的身份、背景、时间、声音退化 |
| 保留好素材比例 | 原通过素材实际保留时长/原通过时长 |
| 依赖处理正确性 | stale/复核/保留是否符合真实图 |
| 全片观感 | 用户对故事、节奏、风格、接缝和声音评价 |
| 工程完成度 | 加载、真实请求、收货、恢复、正式版本是否一致 |
| 时间/观看负担 | 生成耗时、等待、重做量与需要用户审片数量 |

用时间码、版本、可播放链接和简短评语支撑指标。样本少时报告次数与范围，不发表无证据的稳定率。

## 7. 从测试到新版本

记录一条规则的适用条件、选择动作、禁用条件、证据、反例。单例先记有限配方；多个故事/视角/难度持续成立才提升默认规则，重要规则保独立冻结复验。

能力字段改变只改能力档与适配契约；流程缺陷改职责对应skill；资产缺陷改批准资源；模型随机失败留候选分布。更新共享协议时保持三份完全一致的版本/hash，运行固定旧版本，新任务用新版本。

一个范围可“稳定使用”的条件：正式规则确实加载；执行者自主选法并诚实恢复；关键修复在新任务迁移；用户看过真实成片并接受；剩余方法限制明确。没有这些证据就保持实验版，不靠文件完整宣布封板。

