# 技能清单

按这个顺序调用。每条技能一个目录，目录里放 `SKILL.md`。技能文件供 Agent 读取，不由展示页渲染。

所有 Agent 先读 `skills/grok-long-video/SKILL.md` 的共享入口和 `GUIDE.md`。涉及 Grok 长视频时，按入口继续读共享协议、能力档和对应模块；这套技能不新增 Agent，也不改变 `data.json` 的作品展示层级。

| 顺序 | 技能 | 作用 | 状态 |
| --- | --- | --- | --- |
| 0 | grok-long-video | Grok 长视频共享入口；规划、生成、修复、编排和测试 | v0.1 实验版 |
| 1 | brief | 读任务书，拆成分镜表 | 等待任务书 |
| 2 | shot | 逐镜出图，保留版本 | 未开始 |
| 3 | review | 把修改过程写进 notes | 未开始 |
| 4 | export | 全部通过后合成预览片 | 未开始 |

## Grok 长视频共享技能

入口：`skills/grok-long-video/SKILL.md`

模块：

- `create/SKILL.md`：全片规划、锚点、生成路径、候选和根帧重建。
- `repair/SKILL.md`：找最早偏离，小偏离保片修补，大偏离重建必要范围并回归下游。
- `orchestrate/SKILL.md`：把规划、生成、审片、修复、正式选片、声音和成片接成闭环。

共享参考：`references/shared-protocol.md`、`references/grok-capabilities.md`。每个模块的专用参考在同一目录下；`complete/` 保留三份完整 Markdown 交付归档。
