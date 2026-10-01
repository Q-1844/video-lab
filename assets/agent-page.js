(function () {
  const BASE = "/video-lab/";
  const id = document.body.dataset.agentId;
  const $ = (selector, root = document) => root.querySelector(selector);

  function path(value) {
    return value && !value.startsWith("/") && !value.startsWith("http") ? BASE + value : value;
  }

  function render(agent) {
    $("#agent-kicker").textContent = agent.session || agent.id || "conversation";
    $("#agent-title").textContent = agent.name || agent.id;
    $("#agent-description").textContent = agent.description || "这个页面只展示该对话 Agent 的项目和过程。";
    const root = $("#agent-projects");
    root.replaceChildren();
    (agent.projects || []).forEach((project) => {
      const card = document.createElement("article");
      card.className = "card agent-project-card";
      const title = document.createElement("h2");
      title.textContent = project.name || "未命名项目";
      const note = document.createElement("p");
      note.className = "sub";
      note.textContent = project.note || "";
      card.append(title, note);
      if (project.film) {
        const video = document.createElement("video");
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.src = path(project.film);
        if (project.poster) video.poster = path(project.poster);
        card.append(video);
      }
      const process = (project.steps || []).map((step) => `${step.title || ""}：${step.body || ""}`).join("\n\n");
      if (process) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "查看制作过程";
        const body = document.createElement("p");
        body.className = "sub preline";
        body.textContent = process;
        details.append(summary, body);
        card.append(details);
      }
      root.append(card);
    });
    if (!agent.projects?.length) {
      root.innerHTML = '<div class="empty-state card">这个对话还没有项目。请先把素材放到「用户台」，再在仓库里新增项目条目。</div>';
    }
  }

  fetch(`${BASE}data.json?ts=${Date.now()}`)
    .then((response) => response.json())
    .then((data) => {
      const agent = (data.board || []).find((item) => item.id === id);
      if (agent) render(agent);
      else $("#agent-projects").innerHTML = '<div class="empty-state card">找不到这个对话 Agent。</div>';
    })
    .catch(() => {
      $("#agent-projects").innerHTML = '<div class="empty-state card">暂时无法读取数据，请稍后刷新。</div>';
    });
})();
