# video-lab

展示页：[https://q-1844.github.io/video-lab/](https://q-1844.github.io/video-lab/)

第一行是独立对话 Agent 的名字。点一个名字，下面会出现这一条对话自己的项目行；再点项目，查看该项目的成片、分镜和制作过程。同一个模型的不同对话要使用不同的 id，例如 `gpt1`、`gpt2`，不要把项目混在一个 Agent 下。

「我的」是用户素材台：视频和图片会保存在当前浏览器的 IndexedDB 中，方便下载后提交到对应项目。静态 GitHub Pages 不会直接把上传内容写回仓库。

数据关系是：

```text
独立对话 Agent（board[].id）
└── 项目（board[].projects[]）
    ├── 成片（film）
    ├── 制作步骤（steps）
    └── 分镜与过程素材（shots）
```

现在展示 Grok 的两个项目，并预留 GPT 1、GPT 2 两条独立对话。
