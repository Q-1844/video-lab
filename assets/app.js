(function () {
  const BASE = "/video-lab/";
  const state = { board: [], agents: [], agentIndex: 0, projectIndex: 0 };

  const $ = (selector, root = document) => root.querySelector(selector);

  function downloadLink(href, name, label = "下载") {
    const link = document.createElement("a");
    link.className = "btn btn-small";
    link.href = href;
    link.download = name;
    link.textContent = label;
    return link;
  }

  function safePath(path) {
    if (!path) return "";
    return path.startsWith("/") || path.startsWith("http") ? path : BASE + path;
  }

  function agentLabel(agent) {
    return agent.name || agent.label || agent.id || "未命名 Agent";
  }

  function projectCard(project, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-tab" + (index === state.projectIndex ? " active" : "");
    button.dataset.projectIndex = String(index);
    const name = document.createElement("strong");
    name.textContent = project.name || "未命名项目";
    const status = document.createElement("span");
    status.textContent = project.film ? "有成片" : "进行中";
    button.append(name, status);
    button.addEventListener("click", () => {
      state.projectIndex = index;
      draw();
    });
    return button;
  }

  function mediaPreview(path, poster, kind = "video") {
    const src = safePath(path);
    if (!src) return null;
    if (kind === "image") {
      const image = document.createElement("img");
      image.src = src;
      image.alt = "";
      image.loading = "lazy";
      return image;
    }
    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = src;
    if (poster) video.poster = safePath(poster);
    return video;
  }

  function renderProcess(project, root) {
    if (!project.steps || !project.steps.length) return;
    const heading = document.createElement("h3");
    heading.textContent = "制作过程";
    root.append(heading);
    const list = document.createElement("div");
    list.className = "process-list";
    project.steps.forEach((step, index) => {
      const details = document.createElement("details");
      if (index === 0) details.open = true;
      const summary = document.createElement("summary");
      summary.textContent = step.title || `步骤 ${index + 1}`;
      const body = document.createElement("p");
      body.className = "sub";
      body.textContent = step.body || "";
      details.append(summary, body);
      list.append(details);
    });
    root.append(list);
  }

  function renderShots(project, root) {
    if (!project.shots || !project.shots.length) return;
    const heading = document.createElement("h3");
    heading.textContent = "分镜与过程素材";
    root.append(heading);
    const grid = document.createElement("div");
    grid.className = "shot-grid";
    project.shots.forEach((shot) => {
      const card = document.createElement("article");
      card.className = "shot-card";
      const kicker = document.createElement("p");
      kicker.className = "meta";
      kicker.textContent = `分镜 ${shot.id || ""}${shot.status ? ` · ${shot.status}` : ""}${shot.owner ? ` · ${shot.owner}` : ""}`;
      const title = document.createElement("h4");
      title.textContent = shot.title || "未命名镜头";
      card.append(kicker, title);
      if (shot.image) card.append(mediaPreview(shot.image, "", "image"));
      if (shot.action) {
        const action = document.createElement("p");
        action.textContent = shot.action;
        card.append(action);
      }
      const links = document.createElement("div");
      links.className = "button-row";
      if (shot.image) links.append(downloadLink(safePath(shot.image), `${project.name || "项目"}-${shot.id || "镜头"}.jpg`, "下载静帧"));
      if (shot.clip) {
        const video = mediaPreview(shot.clip, shot.image);
        card.append(video);
        links.append(downloadLink(safePath(shot.clip), `${project.name || "项目"}-${shot.id || "镜头"}.mp4`, "下载这一镜"));
      }
      if (links.childNodes.length) card.append(links);
      grid.append(card);
    });
    root.append(grid);
  }

  function renderProject(project, agent) {
    const root = document.createElement("article");
    root.className = "project-detail";
    const header = document.createElement("div");
    header.className = "project-heading";
    const copy = document.createElement("div");
    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = `${agentLabel(agent)} · ${project.name || "未命名项目"}`;
    const title = document.createElement("h2");
    title.textContent = project.name || "未命名项目";
    const note = document.createElement("p");
    note.className = "sub";
    note.textContent = project.note || "还没有项目说明。";
    copy.append(kicker, title, note);
    if (project.skill) {
      const skillMeta = document.createElement("p");
      skillMeta.className = "meta";
      const skillLink = document.createElement("a");
      skillLink.href = `${BASE}skills/`;
      skillLink.textContent = `规划 skill：${project.skill}`;
      skillMeta.append(skillLink);
      copy.append(skillMeta);
    }
    header.append(copy);
    if (project.film) {
      const filmBox = document.createElement("div");
      filmBox.className = "film-box";
      const label = document.createElement("p");
      label.className = "meta";
      label.textContent = "成片";
      filmBox.append(label, mediaPreview(project.film, project.poster));
      filmBox.append(downloadLink(safePath(project.film), project.filename || `${project.name || "成片"}.mp4`, "下载成片"));
      header.append(filmBox);
    }
    root.append(header);
    renderProcess(project, root);
    renderShots(project, root);
    if (!project.film && !project.steps?.length && !project.shots?.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "这个对话下还没有项目内容。可以先在用户台上传素材，再把项目文件提交到仓库。";
      root.append(empty);
    }
    return root;
  }

  function renderAgent() {
    const agent = state.board[state.agentIndex];
    const projects = $("#projects");
    const projectTabs = $("#project-tabs");
    projects.replaceChildren();
    projectTabs.replaceChildren();
    if (!agent) {
      projects.innerHTML = '<p class="empty-state">还没有可展示的对话 Agent。</p>';
      return;
    }
    const heading = document.createElement("div");
    heading.className = "agent-heading";
    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = agent.session || agent.id || "conversation";
    const title = document.createElement("h2");
    title.textContent = agentLabel(agent);
    const description = document.createElement("p");
    description.className = "sub";
    description.textContent = agent.description || `${agent.model || agent.name || "Agent"} 的独立对话工作区。每个项目都有自己的成片、分镜和过程记录。`;
    heading.append(kicker, title, description);
    if (agent.skill_entry) {
      const skillMeta = document.createElement("p");
      skillMeta.className = "meta";
      const skillLink = document.createElement("a");
      skillLink.href = `${BASE}skills/`;
      skillLink.textContent = `已挂技能 ${agent.skill_version || ""}`.trim() + " → 技能页";
      skillMeta.append(skillLink);
      heading.append(skillMeta);
    }
    projects.append(heading);

    const items = agent.projects || [];
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state card";
      empty.innerHTML = "<strong>这个对话还没有项目</strong><br>素材可以先放到「我的」，确认后再加入对应项目。";
      projects.append(empty);
      return;
    }
    items.forEach((project, index) => projectTabs.append(projectCard(project, index)));
    state.projectIndex = Math.min(state.projectIndex, items.length - 1);
    projects.append(renderProject(items[state.projectIndex], agent));
  }

  function draw() {
    const names = $("#names");
    names.replaceChildren();
    state.board.forEach((agent, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "agent-tab" + (index === state.agentIndex ? " active" : "");
      button.textContent = agentLabel(agent);
      button.addEventListener("click", () => {
        state.agentIndex = index;
        state.projectIndex = 0;
        draw();
      });
      names.append(button);
    });
    renderAgent();
  }

  fetch(`${BASE}data.json?ts=${Date.now()}`)
    .then((response) => response.json())
    .then((data) => {
      state.board = Array.isArray(data.board) ? data.board : [];
      draw();
    })
    .catch(() => {
      $("#projects").innerHTML = '<p class="empty-state">暂时无法读取项目数据，请稍后刷新。</p>';
    });
})();
