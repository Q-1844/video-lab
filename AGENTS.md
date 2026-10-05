# 多 agent 规则

展示页只读 `data.json` 里的 `board`。没有作品就不要把自己写上去。

新 agent 只在 `board` 里追加自己的名字和项目，不要改别人的条目。项目里放分镜和成片。改别人的片子时留一句原因，不要覆盖原文件。

开工前也读 `brief.md`。

1. 不覆盖已有版本。新画面只能新增 `v2.png`、`v3.png`。
2. 不修改其他 agent 的 `reviews/<其他名字>/`。
3. 不 force push，不删除别人的提交。
4. 认领镜头时，把 `shots/<镜号>/meta.json` 的 `owner` 写成自己的名字，`status` 写成 `draft`。
5. 单文件小于 50MB。预览片过大就裁短，不用 Git LFS。
6. 改完镜头必须同步根目录 `data.json` 的 `board`。展示页只读这份文件。
7. `status` 只允许 `draft`、`review`、`rejected`、`approved`。
8. 不要把 token、密码明文写进任何文件。唯一例外：`assets/site-config.js` 里的评价入库 token（base64 编码，站主确认内置，仅授权本仓库），其他 agent 不要删除、外传或明文化它；token 失效时由站主提供新值更新该文件。

9. 展示页第一行是名字，点开后下面是自己的项目。只把自己追加进 `data.json` 的 `board`，不要删别人，也不要改别人的 `reviews/`。
10. 每个项目写自己的名称、分镜和成片。没有作品就不要出现在展示页上。
11. 导航右上角「我的」是给人放视频的页面，在 `user/`。
12. 可以改别人的片子来补短处，但要在项目说明里写一句原因，并新增文件，不覆盖原片，也不改对方的名字。

13. 所有 Agent 开工前先读 `brief.md`、`skills/00-index.md` 和本文件。涉及 Grok 长视频的规划、生成、审片、修复、延长、接续或成片时，再完整读取 `skills/grok-long-video/SKILL.md`、`GUIDE.md`、共享协议、能力档，以及当前任务对应的 `create/`、`repair/` 或 `orchestrate/` 模块；不要只读摘要。
14. `skills/grok-long-video/` 是所有 Agent 共用的仓库级技能，不代表新增 Agent。技能清单和模块结构在 `/video-lab/skills/` 页展示（数据源 `skills/skills.json`），但 `SKILL.md` 正文只由 Agent 按文件入口读取，不由网页渲染。它的三个模块必须使用同一 GLV/1.0 协议、版本和证据分级；没有真实视频工具时只能交 `plan_only` 或合法请求草案，不能声称已完成真机生成。
15. 上传新技能的固定流程：建 `skills/<id>/` 目录（`SKILL.md` 必须带 `name`/`description` frontmatter，可加 `manifest.json`）→ 在 `skills/skills.json` 追加一条 `type: "repo"` 条目 → 在 `skills/00-index.md` 的表格加一行。技能页会自动显示新技能。外部来源只做标记的技能用 `type: "external"`，计划中的占位用 `type: "planned"`。结构参考 [Agent Skills 标准](https://agentskills.io/)。
16. 用户评价流程：总览主页是「放映厅」式界面（大放映器 + 胶片条选镜 + 右侧审片栏，实现为 `assets/theater.js`/`theater.css`，`assets/app.js` 已下线）。审片意见框在右侧审片栏里，对应当前播放的成片或分镜。用户回车即提交，页面用内置 token（`assets/site-config.js`，本机配过则优先用本机的）直接把评价 commit 进 `reviews/user-feedback.json`（字段：`agent`、`project`、`target`（成片为 `film`，分镜为 `shot-镜号`）、`targetLabel`、`text`、`date`），不需要 Agent 中转。用户审核完会直接说「我审核完毕」。听到这句话就读该文件，把自己名下（`agent` 等于自己的 id）`handled` 不为真的条目逐条处理：需要重做的镜头按第 9 条新增 `v2`、把 `shots/<镜号>/meta.json` 的 `status` 改成 `rejected`；处理完把该条目的 `handled` 改成 `true`，可加一句 `result` 说明做了什么。不要改别人名下的条目。网页会显示「Agent 已处理」。
17. 分镜两阶段约定：首次生成走 `create/`，修复阶段走 `repair/`。改分镜时不要覆盖旧文件：新视频存为 `<镜号>-v2.mp4`、`-v3.mp4`，由总览页审片栏的「改这镜」把 `data.json` 里该镜的 `clip` 指向新版、旧版路径自动写进该镜的 `history` 数组（`{clip, image, note, date}`），放映器下方的版本条可在新旧版间切换；插入分镜存为 `<镜号>a.mp4`（镜号字母后缀，如 `03a`），用「后插一镜」或手动在 `data.json` 的 `shots` 数组对应位置插入条目，`status` 从 `draft` 起，不要为插入重排已有镜号。Agent 上传完视频文件后优先让用户在网页上登记，尽量不手改 `data.json`。
18. 音乐专区（`/video-lab/music/`）：数据源是 `music/music.json`，音频文件存 `music/tracks/`。灵光生成的音乐优先由用户在网页表单上传（自动传文件 + 自动登记），Agent 上传时保持同一结构：`{id, title, author: "灵光", style, note, src: "music/tracks/<文件>", date, mvs: []}`，新曲目插到 `tracks` 数组最前。做 MV 时：视频文件按项目惯例归档，然后在该曲目的 `mvs` 数组追加 `{title, video: "<视频路径>", project: "<项目名>", note, date}`，页面会自动在曲目下渲染 MV 播放器。

