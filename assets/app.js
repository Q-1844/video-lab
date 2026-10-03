(function () {
  const BASE = "/video-lab/";
  const state = { board: [], agents: [], agentIndex: 0, projectIndex: 0, feedback: {} };

  function feedbackKey(agent, project, target) {
    return `${agent.id || "agent"}::${project.name || "项目"}::${target}`;
  }

  // 用户评价入库 token 的取用顺序：
  // 1) 本机浏览器 localStorage 里自己配的 token（在「配置 Token」里粘贴的）；
  // 2) 站点内置 token（assets/site-config.js，站主确认内置，全设备免配置）。
  function decodeBuiltinToken(config) {
    const raw = atob(config.feedbackToken);
    const key = config.feedbackTokenKey || "";
    let out = "";
    for (let i = 0; i < raw.length; i++) {
      out += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  }

  function ghToken() {
    try {
      const local = localStorage.getItem("vl-gh-token");
      if (local) return local;
    } catch { /* 读不到就走内置 */ }
    try {
      if (window.VIDEO_LAB_CONFIG && window.VIDEO_LAB_CONFIG.feedbackToken) {
        return decodeBuiltinToken(window.VIDEO_LAB_CONFIG);
      }
    } catch { /* 配置缺失或解码失败按无 token 处理 */ }
    return "";
  }

  function encodeBase64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function decodeBase64Utf8(base64) {
    const binary = atob(base64.replace(/\n/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  const FEEDBACK_URL = "https://api.github.com/repos/Q-1844/video-lab/contents/reviews/user-feedback.json";

  function pushFeedbackEntry(entry) {
    const token = ghToken();
    if (!token) return Promise.reject(new Error("no-token"));
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    return fetch(FEEDBACK_URL, { headers })
      .then((response) => {
        if (response.status === 404) return null;
        if (response.status === 401) return Promise.reject(new Error("token 无效或过期"));
        if (!response.ok) return Promise.reject(new Error(`读取评价文件失败 ${response.status}`));
        return response.json();
      })
      .then((file) => {
        const entries = file && file.content ? JSON.parse(decodeBase64Utf8(file.content)) : [];
        const next = Array.isArray(entries) ? entries.slice() : [];
        next.push(entry);
        return fetch(FEEDBACK_URL, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: `用户评价入库：${entry.agent} / ${entry.project} / ${entry.targetLabel}`,
            content: encodeBase64Utf8(JSON.stringify(next, null, 2) + "\n"),
            ...(file ? { sha: file.sha } : {}),
          }),
        });
      })
      .then((response) => {
        if (response.status === 200 || response.status === 201) return response.json();
        if (response.status === 409 || response.status === 422) return Promise.reject(new Error("文件有新提交，请刷新页面后重试"));
        if (response.status === 401) return Promise.reject(new Error("token 无效或过期"));
        return Promise.reject(new Error(`写入失败 ${response.status}`));
      });
  }

  function flashButton(button, message) {
    const original = button.textContent;
    button.textContent = message;
    setTimeout(() => { button.textContent = original; }, 2200);
  }

  // ---- 分镜管理：网页直接改 data.json（复用内置 token 通道），Agent 只需上传视频文件 ----
  const GH_API_BASE = "https://api.github.com/repos/Q-1844/video-lab/contents/";

  function ghHeaders() {
    return {
      Authorization: `Bearer ${ghToken()}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  function ghPutFile(path, base64Content, sha, message) {
    return fetch(GH_API_BASE + path, {
      method: "PUT",
      headers: ghHeaders(),
      body: JSON.stringify({ message, content: base64Content, ...(sha ? { sha } : {}) }),
    }).then((response) => {
      if (response.status === 200 || response.status === 201) return response.json();
      if (response.status === 401) return Promise.reject(new Error("token 失效"));
      if (response.status === 409 || response.status === 422) return Promise.reject(new Error("同名文件已存在或有新提交，请刷新重试"));
      return Promise.reject(new Error(`上传失败 ${response.status}`));
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(new Error("读取文件失败"));
      reader.readAsDataURL(file);
    });
  }

  function updateDataJson(mutator, message) {
    return fetch(GH_API_BASE + "data.json", { headers: ghHeaders() })
      .then((response) => {
        if (!response.ok) return Promise.reject(new Error(`读取 data.json 失败 ${response.status}`));
        return response.json();
      })
      .then((file) => {
        const data = JSON.parse(decodeBase64Utf8(file.content));
        mutator(data);
        return ghPutFile("data.json", encodeBase64Utf8(JSON.stringify(data, null, 2) + "\n"), file.sha, message)
          .then(() => data);
      });
  }

  function clipDir(clip) {
    if (!clip || clip.startsWith("http") || clip.startsWith("/")) return "";
    const i = clip.lastIndexOf("/");
    return i === -1 ? "" : clip.slice(0, i + 1);
  }

  function nextInsertId(project, afterId) {
    const ids = new Set((project.shots || []).map((s) => s.id));
    for (let i = 0; i < 26; i++) {
      const candidate = `${afterId}${String.fromCharCode(97 + i)}`;
      if (!ids.has(candidate)) return candidate;
    }
    return `${afterId}-${Date.now()}`;
  }

  function makeInput(placeholder) {
    const el = document.createElement("input");
    el.type = "text";
    el.className = "shot-form-input";
    el.placeholder = placeholder;
    return el;
  }

  // 分镜卡上的内联表单：replace = 换掉这镜（旧版进历史库），insert = 在这镜后插入新镜。
  function shotManageForm(agent, project, shot, mode, onClose) {
    const form = document.createElement("div");
    form.className = "shot-form";
    form.dataset.mode = mode;

    const titleInput = mode === "insert" ? makeInput("新分镜标题") : null;
    const actionInput = mode === "insert" ? makeInput("这一镜做什么（动作/台词）") : null;
    const noteInput = makeInput(mode === "insert" ? "备注（可选）" : "这次改了什么（存入历史库）");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/mp4,video/quicktime,video/webm";
    const pathInput = makeInput("或填仓库内视频路径，如 projects/echo/clips/03a.mp4");
    if (titleInput) form.append(titleInput);
    if (actionInput) form.append(actionInput);
    form.append(noteInput, fileInput, pathInput);

    const row = document.createElement("div");
    row.className = "button-row";
    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "btn btn-small";
    submitBtn.textContent = "提交";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-small";
    cancelBtn.textContent = "取消";
    cancelBtn.addEventListener("click", () => {
      form.remove();
      if (onClose) onClose();
    });
    row.append(submitBtn, cancelBtn);
    form.append(row);

    submitBtn.addEventListener("click", () => {
      const file = fileInput.files && fileInput.files[0];
      const manualPath = pathInput.value.trim();
      if (!file && !manualPath) {
        flashButton(submitBtn, "选文件或填路径");
        return;
      }
      if (file && file.size > 25 * 1024 * 1024) {
        flashButton(submitBtn, "超过 25MB，请让 agent 上传后填路径");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "提交中…";

      // 编号/版本号一律以远端最新 data.json 为准，避免本地缓存过期造成镜号冲突
      fetch(GH_API_BASE + "data.json", { headers: ghHeaders() })
        .then((response) => {
          if (!response.ok) return Promise.reject(new Error(`读取 data.json 失败 ${response.status}`));
          return response.json();
        })
        .then((file42) => {
          const remote = JSON.parse(decodeBase64Utf8(file42.content));
          const entry = remote.board.find((item) => item.id === agent.id);
          const proj = entry && entry.projects && entry.projects.find((p) => p.name === project.name);
          const remoteShot = proj && Array.isArray(proj.shots) && proj.shots.find((s) => s.id === shot.id);
          if (!remoteShot) return Promise.reject(new Error("原分镜已被其他提交修改，请刷新重试"));
          const newId = mode === "insert" ? nextInsertId(proj, shot.id) : null;
          const versionNo = (remoteShot.history ? remoteShot.history.length : 0) + 2;
          const uploadPath = file
            ? mode === "replace"
              ? `${clipDir(shot.clip)}${shot.id}-v${versionNo}.mp4`
              : `${clipDir(shot.clip)}${newId}.mp4`
            : null;
          const upload = file
            ? fileToBase64(file).then((base64) => ghPutFile(uploadPath, base64, null, `上传分镜视频：${uploadPath}`).then(() => uploadPath))
            : Promise.resolve(manualPath);
          const message = mode === "replace"
            ? `分镜改版：${agent.id} / ${project.name} / ${shot.id} v${versionNo}`
            : `插入分镜：${agent.id} / ${project.name} / ${newId}`;
          return upload
            .then((clipPath) =>
              updateDataJson((data) => {
                const entry2 = data.board.find((item) => item.id === agent.id);
                const proj2 = entry2 && entry2.projects && entry2.projects.find((p) => p.name === project.name);
                if (!proj2 || !Array.isArray(proj2.shots)) throw new Error("仓库里找不到该项目，请刷新重试");
                if (mode === "replace") {
                  const target = proj2.shots.find((s) => s.id === shot.id);
                  if (!target) throw new Error("原分镜已被其他提交修改，请刷新重试");
                  target.history = target.history || [];
                  target.history.push({ clip: target.clip, image: target.image || "", note: noteInput.value.trim(), date: new Date().toISOString().slice(0, 10) });
                  target.clip = clipPath;
                  target.image = "";
                  target.status = "review";
                } else {
                  if (proj2.shots.some((s) => s.id === newId)) throw new Error("镜号刚被占用，请刷新重试");
                  const idx = proj2.shots.findIndex((s) => s.id === shot.id);
                  if (idx === -1) throw new Error("原分镜已被其他提交修改，请刷新重试");
                  proj2.shots.splice(idx + 1, 0, {
                    id: newId,
                    title: (titleInput && titleInput.value.trim()) || `新分镜 ${newId}`,
                    action: (actionInput && actionInput.value.trim()) || "",
                    clip: clipPath,
                    status: "review",
                  });
                }
              }, message),
            );
        })
        .then((data) => {
          state.board = Array.isArray(data.board) ? data.board : [];
          const projects = (state.board[state.agentIndex] || {}).projects || [];
          state.projectIndex = Math.max(0, Math.min(state.projectIndex, projects.length - 1));
          draw();
        })
        .catch((error) => {
          flashButton(submitBtn, error.message || "提交失败，重试");
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "提交";
        });
    });

    return form;
  }

  // 有视频的成片/分镜下方的用户评价框：输入 → 回车或点提交 → 自动 commit 进仓库，所有 Agent 可见。
  function renderFeedback(agent, project, target, targetLabel) {
    const key = feedbackKey(agent, project, target);
    const box = document.createElement("div");
    box.className = "feedback-box";
    const title = document.createElement("p");
    title.className = "meta";
    title.textContent = "用户评价";
    box.append(title);

    const row = document.createElement("div");
    row.className = "feedback-row";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "feedback-input";
    input.placeholder = "写一句评价，回车提交";
    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "btn btn-small";
    submit.textContent = "提交";
    row.append(input, submit);

    const list = document.createElement("div");
    list.className = "feedback-list";

    function drawList() {
      list.replaceChildren();
      (state.feedback[key] || []).forEach((entry) => {
        const item = document.createElement("div");
        item.className = "feedback-entry" + (entry.handled ? " feedback-handled" : "");
        const meta = document.createElement("p");
        meta.className = "meta";
        meta.textContent = `${entry.date || ""} · ${entry.handled ? "已处理" : "待处理"}`;
        const body = document.createElement("p");
        body.textContent = entry.text || "";
        item.append(meta, body);
        if (entry.result) {
          const result = document.createElement("p");
          result.className = "feedback-hint";
          result.textContent = `处理结果：${entry.result}`;
          item.append(result);
        }
        list.append(item);
      });
    }

    function submitFeedback() {
      const text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }
      const entry = {
        agent: agent.id || "agent",
        project: project.name || "项目",
        target,
        targetLabel,
        text,
        date: new Date().toISOString().slice(0, 10),
      };
      submit.disabled = true;
      submit.textContent = "提交中…";
      pushFeedbackEntry(entry).then(
        () => {
          (state.feedback[key] = state.feedback[key] || []).push(entry);
          input.value = "";
          drawList();
          flashButton(submit, "已提交");
        },
        () => {
          input.focus();
          flashButton(submit, "提交失败，重试");
        },
      ).finally(() => {
        submit.disabled = false;
        submit.textContent = "提交";
      });
    }

    submit.addEventListener("click", submitFeedback);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        submitFeedback();
      }
    });

    drawList();
    box.append(row, list);
    return box;
  }

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

  function renderShots(project, agent, root) {
    if (!project.shots || !project.shots.length) return;
    const heading = document.createElement("h3");
    heading.textContent = "分镜与过程素材";
    root.append(heading);
    const grid = document.createElement("div");
    grid.className = "shot-grid";
    project.shots.forEach((shot, shotIndex) => {
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

      // 旧版本收进历史库（原位只显示最新版）
      if (Array.isArray(shot.history) && shot.history.length) {
        const history = document.createElement("details");
        history.className = "shot-history";
        const summary = document.createElement("summary");
        summary.textContent = `历史版本 ${shot.history.length}`;
        history.append(summary);
        shot.history.forEach((old) => {
          const item = document.createElement("div");
          item.className = "shot-history-item";
          const meta = document.createElement("p");
          meta.className = "meta";
          meta.textContent = `${old.date || ""}${old.note ? ` · ${old.note}` : ""}`;
          item.append(meta);
          if (old.clip) item.append(mediaPreview(old.clip, old.image));
          history.append(item);
        });
        card.append(history);
      }

      // 网页直接改分镜：换版本 / 其后插入
      if (shot.clip && ghToken()) {
        const manage = document.createElement("div");
        manage.className = "button-row shot-manage";
        let openForm = null;
        const toggleForm = (mode) => {
          const same = openForm && openForm.dataset.mode === mode;
          if (openForm) openForm.remove();
          openForm = null;
          if (!same) {
            openForm = shotManageForm(agent, project, shot, mode, () => { openForm = null; });
            manage.after(openForm);
          }
        };
        const replaceBtn = document.createElement("button");
        replaceBtn.type = "button";
        replaceBtn.className = "btn btn-small";
        replaceBtn.textContent = "改这镜";
        replaceBtn.addEventListener("click", () => toggleForm("replace"));
        const insertBtn = document.createElement("button");
        insertBtn.type = "button";
        insertBtn.className = "btn btn-small";
        insertBtn.textContent = "后插一镜";
        insertBtn.addEventListener("click", () => toggleForm("insert"));
        manage.append(replaceBtn, insertBtn);
        card.append(manage);
      }

      if (shot.clip) {
        card.append(renderFeedback(agent, project, `shot-${shot.id || shotIndex + 1}`, `分镜 ${shot.id || shotIndex + 1}（${shot.title || ""}）`));
      }
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
      filmBox.append(renderFeedback(agent, project, "film", "成片"));
      header.append(filmBox);
    }
    root.append(header);
    renderProcess(project, root);
    renderShots(project, agent, root);
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

  function loadFeedback() {
    return fetch(`${BASE}reviews/user-feedback.json?ts=${Date.now()}`)
      .then((response) => (response.ok ? response.json() : []))
      .catch(() => [])
      .then((entries) => {
        const map = {};
        (Array.isArray(entries) ? entries : []).forEach((entry) => {
          const key = `${entry.agent || "agent"}::${entry.project || "项目"}::${entry.target || ""}`;
          (map[key] = map[key] || []).push(entry);
        });
        state.feedback = map;
      });
  }

  Promise.all([
    fetch(`${BASE}data.json?ts=${Date.now()}`).then((response) => response.json()),
    loadFeedback(),
  ])
    .then(([data]) => {
      state.board = Array.isArray(data.board) ? data.board : [];
      draw();
    })
    .catch(() => {
      $("#projects").innerHTML = '<p class="empty-state">暂时无法读取项目数据，请稍后刷新。</p>';
    });
})();
