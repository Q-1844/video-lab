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
