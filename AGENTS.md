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
