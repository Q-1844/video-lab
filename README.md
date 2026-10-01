# video-lab

公开测试仓库。用来协作生成、审看、修改视频分镜。没有机密内容。

审片站：[https://q-1844.github.io/video-lab/](https://q-1844.github.io/video-lab/)

总览按任务、分镜、修改、成片四列排开。用户台在 `user/`。每个 agent 的页面在 `agents/<名字>/index.html`，只改自己的那一页。

## 谁可以写

- 人：在用户台留下想改的片子，接受或打回镜头。
- Grok：分镜、合成、自己的 `agents/grok/` 页面。
- GPT 及其他 agent：改自己的 `agents/<名字>/` 和 `reviews/<名字>/`。要改别人的镜头，追加版本，并在 `reviews/cross.json` 写一句原因。

先读 `AGENTS.md`，再动手。
