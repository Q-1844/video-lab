---
name: grok-long-video-create
description: 为 Grok Imagine 视频项目先规划完整叙事、资源与连续性，再选择文生、审核首帧、原生首帧加参考、首尾帧、内部关键帧或合法延长生成长视频候选。用户要求首次制作长视频、多故事段短片、镜头规划或在修复中重建根帧和受影响镜头时使用；与 grok-video-repair 和 grok-video-orchestrate 通过 GLV/1.0 联通。
---

# Grok 长视频首次生成

执行版本 v0.1；方法处于 Grok 定向测试阶段，不能声称已由本套文件真机验收。

## 1. 读取依据并输出可执行计划

先读取 [共享协议](#glv-shared) 与 [能力档](#glv-capabilities)。制定生成路径或构造请求时读取 [生成配方](#glv-method)。不要把对话记忆、旧尾帧文件或其他模型的字段当作当前项目依据。

接受 `ProjectBrief / CanonicalSnapshot / ApprovedAnchors / CapabilityProfile`；修复转入时接受 `RepairTicket / frozen_assets / allowed_changes`。输出 `ShotPlan / GenerationReceipts / CandidateVersions / QCReviews / SkillHandoff`。缺实际调用工具时完成规划和合法请求草案，列出未执行项，不虚构视频或回执。

按完整故事规划，再生成；保持 Group、Shot、Beat、GenerationUnit 分层。Group是故事段，不固定两镜、五镜或六镜。优先考虑能保住叙事、人物和运动的生成单元长度，不能把15秒上限当成默认镜头长度。

## 2. 冻结最小制作约束

读取并记录：一句话故事、目标时长/平台/画幅、风格、关键角色与Look、关键道具、Location与Scene State、动作起终态、声音策略、当前正式选片与预算条件。

用户未说明的可逆制作选择采用合理默认并注明；不因普通缺项反复停下询问。没有用户批准的角色形象或剧情重大决定时，把拟定资产标为draft并沿项目已有审批流程提供可审材料。不要新增无依据审批关口。

费用不是此项目的主要限制。候选数量依据难度、改进信息和用户需求决定；遵守真实排队、时长、速率及授权范围，不强制每镜只有1–2条，也不为凑数量生成已经足够好的重复片。

## 3. 建立锚点与空间状态

将角色身份、服装/Look、表情/动作、道具、Location、Scene State与风格分开管理。至少记录可辨认特征、左右侧别、服装、道具持有者、灯/门等关键状态、运动方向与机位关系。

文字锚点不替代图像条件；参考图多不等于更好。选与本镜有关的批准视角和状态，避免旧场景参考把主体拉回旧空间。一个参考负责一个明确用途；混合人物、多视图拼图、低清远景和遮挡图先审查。明确屏幕左右与角色解剖左右，避免镜像误判。

身份敏感的近景、远景转近景、转身后特征重现、关键道具交互及换场镜头，在生成前检查身份和道具依据是否实际进入编译后请求。

若需要新首图，沿当前可用生图/编辑工具建立并审核；正确检查人物比例、构图、侧别、道具、场景和剧情状态。历史 `crop` 是原系统生图配方线索，不能当成 Grok 视频字段；根据本工具真实语义选择裁剪、局部编辑或重生。

## 4. 为全片编写 ShotPlan

沿用蓝本13字段：镜号、场景、时长、景别、角度、运镜、画面内容、人物状态、光线、声音、转场、锚点、备注。增加：Group位置、起态、必须终态、生成单元、连续性意图、路径、父资产版本、风险和验收硬条件。

每镜表达清楚的叙事目标；动作写可见的“从什么状态、怎样变化、停在什么状态”。不强制所有镜只容纳一个机械小动作；能自然连贯的动作beats可放在同一生成单元。需要准确多个机位或对白节奏时，优先逐Shot控制。

为换场、时间跳跃和情绪停顿预先设计切镜。允许正常电影剪辑，不要求整部作品像一个无断点长镜头。对双人对话和空间运动检查轴线、视线、进出画方向；真正跨轴时用观众可理解的机位移动或重新交代。

把总时长按实际保留区间和转场重叠预算；生成长度可含剪辑余量，但必须有余量用途。快速动作避免无事可做的长尾，否则容易凭空添空间、动作或故事事件。

## 5. 为每单元选择路径

按以下顺序判断，而非套固定接口链：

1. **新故事段/换场/新机位**：优先按剧情独立建立；需要身份时使用approved_frame_i2v或reference_reestablish。是否继承上一组单独判断。
2. **同一动作继续且尾帧清晰正确**：比较real_tail_i2v与native_first_plus_refs；身份风险高时优先测试已接通的原生首帧＋Look。参考组合最高720p。
3. **尾帧空间/动作可用但人物远小或不清楚**：先判断起点是否能满足身份硬条件；可用组合再锚定，或用审核后的融合首帧重建；若构图改变，明确切镜/重建起点。
4. **尾帧身份/场景/故事状态已经错误**：交修复或正常切镜重新建立；不把错误尾帧继续当身份锚。
5. **起终态需要精确落点**：两端合格、动作可达时选择first_last_generate；内部阶段确需控制时再加稀疏合法keyframes，不能每镜填满4个。
6. **同镜需要更多时间**：在合法源长度、正确末态与独立model映射成立时比较native_extend与分段首帧＋Look；不能假定经典延长保住1.5画风，也不能无限递交完整长片。
7. **纯新氛围/身份弱镜头**：可用independent_t2v发挥模型；要统一精确角色时，优先实际图像条件而不是仅堆锚点文字。

遵守能力档的可用性检查；高级路径不可用时明确降级。原生首帧＋Look可用也不代表所有任务必胜，保留融合首帧、reference重新建立和剪辑的备选。

## 6. 按输入模式编译提示词

把九要素当检查清单，按模式压缩成必要指令；不强制每条都有同样长的九段。

| 模式 | 提示词重心 | 关键检查 |
|---|---|---|
| t2v | 主体、具体外观、空间、起终态、运动、风格/声音 | 足以自行建立画面，不假定上一镜记忆 |
| i2v | 动作变化、物理过程、运镜、停点 | 仅保留易漂移的必要身份条件，避免无关重述或与首图矛盾 |
| 首帧＋refs | 起点继承、每图用途、人物/道具保持、动作 | `image`是IMAGE_0，Look从IMAGE_1；不混槽 |
| reference | 目标新画面、每参考职责、允许变化的空间/构图 | 参考不是首帧；身份图背景不应成为当前场景 |
| 首尾/内部帧 | 两端/各beat间怎么运动、机位和时间 | 不可能动作或错误帧先改设计 |
| extend | 当前末态之后发生什么、停在何处 | 不描述已经发生的一整段，不重复动作 |

每条优先写：目标可见变化、首要保持项、一个主运镜、终态。时间分段用于节奏引导；需要固定图像时用实际字段，不把提示词秒数当关键帧。

没有独立negative_prompt字段时，用少量明确约束写在主prompt中，如“one continuous shot”“stop before the door opens”。不要复制通用几十词禁用清单，不假定“符合物理”能弥补不可能动作。

## 7. 先测高信息镜头，再铺开

选代表性单元：角色近景/远近变化、关键道具交互、换场或同镜接续。先检验Look、风格和路径，再扩展其他单元；无需每个新项目都跑同样数量。

独立候选可并行；以未选上游尾帧为起点的正式下游等待，或明确建立候选分支，不能混用多个父版本。每次提交前写事前选择理由、真实路径、输入绑定和验收条件。

提交后立即保存request_id和依据，按同一ID轮询收货。提交结果不明时先核对现有任务，不能直接重发；参数错误先改构造，不反复撞同一个400。

检查实际MP4可播放、时长/比例/分辨率/音轨，然后整段审查；首/中/尾帧只是索引。未知seed写null，不用虚构种子证明可复现。

## 8. 质检与修复交接

按共享协议检查15维与起终态。分别报告请求结果、制作选择、视觉效果。遇偏差先生成带证据的RepairTicket，由 `$grok-video-repair` 分类：可接受、小偏离、大偏离或证据不足。

输出可播放候选、首中尾帧索引、预期/实际终态、依赖、推荐理由与保留问题。用户满意不自动等于正式选片；沿项目真实选片入口写入，再提取该版本末帧、更新下游freshness。

修复交回重建任务时只改变ticket许可范围，冻结合格角色资源、故事结局与无依赖镜头。完成后向 `$grok-video-orchestrate` 返回候选、审查和需要用户决定的事项。

## 9. 生成阶段的完成条件

所需生成单元都有可查候选/回执；硬条件通过或明确待审；时间线和声音需求能由编排读取；错误根点有修复去向；下游不会继续引用被静默覆盖的旧尾帧。不能以“请求都完成”代替“长视频已合格”。


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

# 附录C：生成配方

# 生成配方与长视频示例 · v0.1

目录：选择生成单元；首帧＋Look；融合；reference；关键帧；延长；60秒走查；提示词自检。

本文件全部配方为待Grok实测的制作建议。官方参数以能力档为准；示例不是本轮已生成视频。

## 1. 给模型恰当的生成单元

| 内容 | 起始测试长度建议 | 选择理由与观察 |
|---|---|---|
| 简单氛围/慢动作 | 6–12s | 能提供持续事件；观察空尾或擅自换场 |
| 身份敏感近景/道具接触 | 3–6s | 先验证特征和交互，难动作允许拆分 |
| 有先后逻辑的连续beats | 6–10s | 先写动作因果，检查顺序而非仅端点 |
| 转场或完整小段落 | 8–15s | 需要足够故事容量；明显超载则拆单元 |
| 有明确长镜头意图 | 先做可控短段再扩展 | 比较延长与首帧分段，不能无限续完整片 |

这些是实验起点，不是模型质量保证或固定门槛。一个“拿杯”可能需更长，15秒也可能可控；判断看实际动作容量和当前账号表现。目标每秒必须有用，不强迫动作太快，也不让模型填补空白。

## 2. 配方A：正确尾帧＋原生Look

适用：同一动作/空间继续，上一镜真实尾帧正确，但需要再锚定身份/画风。前置：1.5组合能力在本平台可用、正确比例、参考图清晰。

本地绑定：`image=父版真实尾帧→IMAGE_0`；`reference_images[0]=批准Look→IMAGE_1`。若加入道具图，按实际顺序绑定IMAGE_2。不要发一张九宫格期望每格自动成为独立角色。

```text
Continue from the pose and spatial layout in <IMAGE_0>.
Preserve the otter's identity, orange raincoat, blue scarf and anatomical left-cheek white patch from <IMAGE_1>.
The otter walks screen-right along the pier, holding the unlit brass lantern steadily in its right hand, then stops at the doorway before opening the door.
One continuous medium shot, a gentle lateral camera track. Keep the established painted 2D style and lighting.
```

按实际需求压缩身份描述；如果尾帧的白斑已在错误侧，不能假装组合会同时严格保留原首帧和恢复正确侧。交修复或接受新起点。

验收：实际首帧符合接续、首段没有突然重摆姿态、过程中特征稳定、道具保持未亮、门没有提前打开、末态能供下一镜使用。首帧好看不能代替这些条件。

## 3. 配方B：融合新首帧＋i2v

适用：渠道未开放原生组合、需要换景别/纠正构图，或新起点允许变化。需要另一个确实支持参考/编辑的生图工具；Grok视频API不是融合生图工具。

步骤：批准Look负责身份/衣服，父尾帧负责可保留的构图/空间/动作，目标场景依据负责当前地点；生成一张新首图→审核→i2v。实际请求不要使用不存在的“保留所有像素”字段。

生图任务说明示例：

```text
建立一张用于下一镜的首图。用批准Look保持角色身份、服装和白斑侧别；沿父片真实尾帧保留栈桥、灯的位置及行动方向。允许把角色从远景重新构图为中景。铜灯保持未点亮，门保持关闭。输出目标画幅的单张图，不做拼贴，不把Look参考图的背景搬进场景。
```

这不是严格原尾帧接续。若首图改变构图，设计合理切镜；若必须无缝单镜，先修父片或选合法原生路径。图审核不通过先修图，不花视频请求去放大错误。

## 4. 配方C：reference重新建立

适用：新组/换地点/换机位，想保角色而无需同一首帧。选角色、道具和**目标**场景；上一镜尾帧可用作视觉关联参考，但先问是否真的需要，避免拉回旧空间。

```text
Show the otter from <IMAGE_0>, carrying the lantern from <IMAGE_1>, inside the repair room shown in <IMAGE_2>.
The otter places the still-unlit lantern on the bench and examines its broken handle.
New interior medium shot, steady camera, warm workbench light. Preserve the otter's outfit and the painted 2D style. The pier background in the character reference does not define this location.
```

真正需要同一动作进门时，不必强制使用reference换场；比较从正确首帧连续跨空间，或从空间设计图重建。旧场景绑错优先修binding，不直接宣称reference天生不能换场。

## 5. 配方D：稀疏内部帧控制动作

适用：动作阶段必须按顺序到达；两端都能描述，但只靠文字常跳过关键步骤。先设计可达帧，不用网格图当顺序关键帧。

6秒示例：首帧“灯在桌上”，2秒“手抓住提手”，4秒“灯被提至胸口”，尾帧“稳稳放到门边架上”。各图同一身份/画幅/灯尺寸/背景关系，时间用合法1/3秒网格。

先测试一个最关键中间帧是否已经足够，再增加第二个。加帧可能引入停顿、视觉形变或机械动作，比较约束少/多的候选；不要把四帧当必填。

检查顺序、到点时刻、帧附近连续性、帧之间物理、是否无意义停顿及多余变化。端点匹配不能掩盖错误中段。

## 6. 配方E：原生延长与滚动上下文

适用：同镜连续运动值得保留，延长能力及该路径的实际model已核验。

先把输入末态写清，只描述**之后**发生的动作。源若10秒，新增6秒返回约16秒完整片；不要把这16秒又无条件送给最长15秒的源接口。

超过可接受源长度时，可以从已选视频提取一个合法的末段上下文窗口，例如先测试末段2–6秒，并把它作为新源。这个范围是实验建议；须根据速度/遮挡/音频上下文调节，源必须落在官方2–15秒范围。

设原时间线长度L、输入窗口实际长度W、返回片新增长度E：

1. 记录原时间线窗口 `[L-W,L]` 的实际时间戳和资产版本。
2. 收货后核对返回前W段是否确实对应该窗口，核验交界与输出真实长度；不是只靠请求值算切点。
3. 只把确认新增的区间接入原时间线，保留原批准前段；检查冻结/重复动作/色差/声音。
4. 不确定对应关系或prefix退化时，转首帧＋Look生成新段/合理切镜，不自动剪掉猜测的W秒。

不要承诺滚动窗口等价于整片记忆。身份、故事状态和母锚仍由项目显式传递。延长不表示能同时加Look、内部帧或任意参考音频；组合必须另有实际支持证据。

## 7. 60秒项目走查（计划示例）

故事：《雾港送灯》。主角把修好的铜灯送到灯塔，船得到光信号。角色为橙雨衣、蓝围巾、解剖左颊白三角毛纹的小水獭；铜灯红提手。风格是二维手绘，雨后低饱和环境，灯亮后暖色。

这里演示先规划全片再选择混合生成策略，不固定用户未来作品要照此镜数。

| 组/镜 | 使用时长预算 | 叙事与终态 | 候选路径与理由 |
|---|---:|---|---|
| G1-S1 | 5s | 栈桥定场，水獭出现 | 受控首图或reference；建立空间与Look |
| G1-S2 | 7s | 取起未亮铜灯 | 审核首图i2v；道具交互先验证 |
| G1-S3 | 6s | 走到屋门，尚未开门 | 原生首帧＋Look；沿同动作再锚定 |
| G2-S1 | 6s | 室内检查灯 | 独立目标场景首图/reference，正常切镜 |
| G2-S2 | 8s | 修好提手但灯仍未亮 | 带道具条件，必要时稀疏内部帧 |
| G2-S3 | 5s | 提灯走出屋门 | 受控首图或首帧＋Look |
| G3-S1 | 7s | 登塔，进入灯室 | 用目标场景设计；不强迫跨组硬接 |
| G3-S2 | 8s | 举灯、点亮、置于窗前 | 合格首尾状态，必要时内部帧保动作 |
| G3-S3 | 8s | 船看见灯光并回应 | 独立切镜，保全片光线/信号因果 |

使用时长合计60秒；实际生成可含剪辑余量，成片另算。是否把G3-S2拆成两个请求，是否让G1-S2和S3成为同镜延长，都留给样片能力判断。

先看G1-S2道具交互、G1-S3远近接续与G3-S2点灯阶段。若关键样片身份都不成立，回修Look/输入和路径，而不是全9镜一口气生成后再追责。

## 8. 提示词和计划自检

- 起点是否来自正确资产版本？当前请求到底是首帧还是reference？
- 场景状态和动作终态有没有与图片相互矛盾？
- prompt有没有把已经发生的事又重做一次？
- 身份、空间、道具与风格谁由图管，谁由文字补？
- 关键帧和动作时间是否真的可达？是否把所有约束堆满？
- 要多个镜头时是否另设Shot？无切镜时是否删除了反打/切换机位指令？
- 声音需求能否实际实现？没有稳定唇形路径时是否合理采用旁白？
- 每个待生成单元的失败是否有具体修复入口？

