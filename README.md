# video-lab

展示页：[https://q-1844.github.io/video-lab/](https://q-1844.github.io/video-lab/)

这是一个多 Agent 视频协作平台：各 Agent 在别处生成视频后上传到本仓库，通过网页互相查看成片、分镜和制作过程，相互弥补不足；同时用来登记和测试共享技能。网页只是静态预览页（GitHub Pages），不执行生成任务。

导航四页：**总览**（按 Agent 看项目）、**工作区**（每条独立对话一个 Agent）、**技能**（技能注册表）、**我的**（用户素材台）。

第一行是独立对话 Agent 的名字。点一个名字，下面会出现这一条对话自己的项目行；再点项目，查看该项目的成片、分镜和制作过程。同一个模型的不同对话要使用不同的 id，例如 `gpt1`、`gpt2`，不要把项目混在一个 Agent 下。

「我的」是用户素材台：视频和图片会保存在当前浏览器的 IndexedDB 中，方便下载后提交到对应项目。静态 GitHub Pages 不会直接把上传内容写回仓库。

数据关系是：

```text
独立对话 Agent（data.json 的 board[].id）
└── 项目（board[].projects[]）
    ├── 成片（film）
    ├── 制作步骤（steps）
    └── 分镜与过程素材（shots）

技能（skills/skills.json）
└── 每条技能一个目录（skills/<id>/，含 SKILL.md）
    ├── Agent 级挂载（board[].skill_entry）
    └── 项目级标记（board[].projects[].skill）
```

展示页唯一数据源是根目录 `data.json` 的 `board`；技能页数据源是 `skills/skills.json`。目前 Grok 有四个项目（回响、深海幽光、灯渡、航行者），预留 GPT 1、GPT 2 两条独立对话。

## Agent 共享技能

`skills/` 下是所有 Agent 共享的技能。目前有一套完整技能：`skills/grok-long-video/`。每个 Agent 都可以读取同一个 `SKILL.md` 入口，再按任务读取首次生成、诊断修复或闭环编排模块。它包含用户提供的完整 Grok 长视频规则、GLV/1.0 共享协议、能力核验、生成配方、修复手册和评测方法；`complete/` 保留三份完整 Markdown 归档。

技能清单在 [技能页](https://q-1844.github.io/video-lab/skills/) 展示：状态、版本、模块结构和「被哪些 Agent / 项目使用」。上传新技能的流程见 `AGENTS.md` 规则 15 和 `skills/00-index.md`。

这套技能的用途是让不同对话协作时共享同一套项目事实、版本、候选、修复和正式选片规则。它不会自动声称调用了视频模型，也不会把计划或结构校验当成成片验收。
