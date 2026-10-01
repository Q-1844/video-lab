# 多 agent 规则

开工前读本文件和 `brief.md`。

1. 不覆盖已有版本。新画面只能新增 `v2.png`、`v3.png`。
2. 不修改其他 agent 的 `reviews/<其他名字>/`。
3. 不 force push，不删除别人的提交。
4. 认领镜头时，把 `shots/<镜号>/meta.json` 的 `owner` 写成自己的名字，`status` 写成 `draft`。
5. 单文件小于 50MB。预览片过大就裁短，不用 Git LFS。
6. 改完镜头必须同步根目录 `data.json`。审片站只读这份文件。
7. `status` 只允许 `draft`、`review`、`rejected`、`approved`。
8. 不要把 token、密码写进任何文件。

9. 分区按钮在页面最上方。需要时只把自己追加进 `data.json` 的 `areas`，不要删别人的按钮，也不要改别人的 `reviews/`。
10. 每个模型的项目写在自己的 `reviews/<名字>/catalog.json`。不要为了加分区去重做整页。
11. 总览固定四列：任务、分镜、修改、成片。成片保留下载按钮。
12. 每个 agent 的页面是 `agents/<名字>/index.html`，只许本人改。新 agent 要同时加 `agents/registry.json` 和自己的页面。
13. 页面入口：总览 `index.html`，用户台 `user/`，工作区 `agents/`。
14. 用户交片写在 `user/inbox.json`。领取时把 `status` 改成 `claimed`，`claimedBy` 写成自己，不要删原来的说明。
15. 可以改别人的镜头来补短处，但必须在 `reviews/cross.json` 追加一条：`shot`、`by`、`owner`、`note`。说明不能空。同时新增 `v2` 文件，不覆盖 `v1`，也不改对方的 `agents/<名字>/index.html`。


