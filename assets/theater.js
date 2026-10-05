(function () {
  const BASE = "/video-lab/";
  const GH_API_BASE = "https://api.github.com/repos/Q-1844/video-lab/contents/";
  const REPO = "https://github.com/Q-1844/video-lab";
  const state = {
    board: [],
    agentIndex: 0,
    projectIndex: 0,
    mode: "shots",
    shotIndex: 0,
    versionIndex: -1, // -1 = 当前版；>=0 = history 下标
    feedback: {},
    autoplay: localStorage.getItem("vl-autoplay") === "1",
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  /* ---- 工具（token / GH 写入，与原 app.js 等价） ---- */
  function decodeBuiltinToken(config) {
    const raw = atob(config.feedbackToken);
    const key = config.feedbackTokenKey || "";
    let out = "";
    for (let i = 0; i < raw.length; i++) out += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    return out;
  }
  function ghToken() {
    try {
      const local = localStorage.getItem("vl-gh-token");
      if (local) return local;
      if (typeof VIDEO_LAB_CONFIG !== "undefined" && VIDEO_LAB_CONFIG.feedbackToken) {
        return decodeBuiltinToken(VIDEO_LAB_CONFIG);
      }
    } catch (error) { /* fallthrough */ }
    return "";
  }
  function encodeBase64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function decodeBase64Utf8(base64) {
    const binary = atob(base64.replace(/\n/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
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
  function flashButton(button, message) {
    const original = button.textContent;
    button.textContent = message;
    button.disabled = true;
    setTimeout(() => { button.textContent = original; button.disabled = false; }, 2200);
  }
  function safePath(path) {
    if (!path) return "";
    return path.startsWith("/") || path.startsWith("http") ? path : BASE + path;
  }
  function downloadLink(href, name, label) {
    const link = document.createElement("a");
    link.className = "btn btn-small";
    link.href = href;
    link.download = name;
    link.textContent = label || "下载";
    return link;
  }
  function makeInput(placeholder) {
    const el = document.createElement("input");
    el.type = "text";
    el.placeholder = placeholder;
    return el;
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

  /* ---- 评价入库 ---- */
  const FEEDBACK_URL = GH_API_BASE + "reviews/user-feedback.json";
  function feedbackKey(agent, project, target) {
    return `${agent.id || "agent"}::${project.name || "项目"}::${target}`;
  }
  function pushFeedbackEntry(entry) {
    const token = ghToken();
    if (!token) return Promise.reject(new Error("no-token"));
    return fetch(FEEDBACK_URL, { headers: ghHeaders() })
      .then((response) => {
        if (response.status === 404) return null;
        if (response.status === 401) return Promise.reject(new Error("token 无效或过期"));
        if (!response.ok) return Promise.reject(new Error(`读取评价文件失败 ${response.status}`));
        return response.json();
      })
      .then((file) => {
        const entries = file ? JSON.parse(decodeBase64Utf8(file.content)) : [];
        entries.push(entry);
        return ghPutFile("reviews/user-feedback.json", encodeBase64Utf8(JSON.stringify(entries, null, 2) + "\n"), file ? file.sha : null, `用户评价：${entry.agent} / ${entry.project} / ${entry.target}`);
      });
  }

  /* ---- 数据访问 ---- */
  function agentOf() { return state.board[state.agentIndex] || { projects: [] }; }
  function projectOf() { return (agentOf().projects || [])[state.projectIndex] || { shots: [] }; }
  function currentShot() { return (projectOf().shots || [])[state.shotIndex] || null; }
  function hasStuff(agent) {
    return (agent.projects || []).some((p) => p.film || (p.shots || []).length || (p.steps || []).length);
  }

  /* ---- 渲染 ---- */
  function renderChips() {
    const ac = $("#agent-chips");
    ac.replaceChildren();
    state.board.forEach((agent, i) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "tab" + (i === state.agentIndex ? " on" : "");
      tab.title = agent.role ? `${agent.name || agent.id} · ${agent.role}` : (agent.name || agent.id || "");
      const st = document.createElement("span");
      st.className = "tdot" + (hasStuff(agent) ? " ok" : "");
      tab.append(st, document.createTextNode(agent.name || agent.id || "未命名"));
      tab.addEventListener("click", () => {
        state.agentIndex = i;
        state.projectIndex = 0;
        state.shotIndex = 0;
        state.versionIndex = -1;
        renderAll();
      });
      ac.append(tab);
    });

    const pc = $("#project-chips");
    pc.replaceChildren();
    (agentOf().projects || []).forEach((p, i) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "tab tab-p" + (i === state.projectIndex ? " on" : "");
      tab.textContent = p.name || "未命名项目";
      tab.addEventListener("click", () => {
        state.projectIndex = i;
        state.shotIndex = 0;
        state.versionIndex = -1;
        renderAll();
      });
      pc.append(tab);
    });
    const multi = (agentOf().projects || []).length > 1;
    pc.hidden = !multi;
    $("#tsep").hidden = !multi;
  }

  // 场记条：面包屑（agent · 项目）+ 元数据（等宽小字）
  function renderCuebar() {
    const crumb = $("#crumb");
    crumb.replaceChildren();
    const agent = agentOf();
    const p = projectOf();
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = (agent.name || agent.id || "AGENT").toUpperCase();
    crumb.append(who);
    const slash = document.createElement("span");
    slash.className = "slash";
    slash.textContent = "/";
    crumb.append(slash);
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = p.name || "未命名项目";
    crumb.append(title);

    const meta = $("#cue-meta");
    meta.replaceChildren();
    const shots = (p.shots || []).length;
    const bits = [];
    if (shots) bits.push(`${shots} 镜`);
    if (p.film) bits.push("1 成片");
    bits.forEach((bit, i) => {
      if (i) {
        const sep = document.createElement("i");
        sep.textContent = "·";
        meta.append(sep);
      }
      const b = document.createElement("b");
      b.textContent = bit;
      meta.append(b);
    });
  }

  function renderStage() {
    const stage = $("#stage");
    const p = projectOf();
    if (state.mode === "film" && !p.film) state.mode = "shots"; // 无成片项目自动回落分镜（先回落再亮灯）
    $("#tab-film").classList.toggle("on", state.mode === "film");
    $("#tab-shots").classList.toggle("on", state.mode === "shots");
    $("#tab-film").disabled = !p.film;

    stage.replaceChildren();
    let media = null;
    if (state.mode === "film" && p.film) {
      media = document.createElement("video");
      media.controls = true; media.playsInline = true; media.preload = "metadata";
      media.src = safePath(p.film);
      if (p.poster) media.poster = safePath(p.poster);
      stage.append(media);
      const meta = document.createElement("div");
      meta.className = "stage-meta";
      const no = document.createElement("span");
      no.className = "no"; no.textContent = "FILM";
      const name = document.createElement("span");
      name.className = "name"; name.textContent = p.name || "成片";
      meta.append(no, name);
      if (p.note || p.film_note) {
        const d = document.createElement("span");
        d.className = "desc"; d.textContent = p.note || p.film_note;
        meta.append(d);
      }
      const dl = downloadLink(safePath(p.film), `${p.name || "film"}.mp4`, "下载成片");
      dl.classList.add("btn-small");
      meta.append(dl);
      stage.append(meta);
    } else if (state.mode === "shots") {
      const shot = currentShot();
      if (shot) {
        // 版本视图：-1 = 当前 clip；0..n = history[i]
        const hist = shot.history || [];
        const viewingHist = state.versionIndex >= 0 && state.versionIndex < hist.length;
        const clip = viewingHist ? hist[state.versionIndex].clip : shot.clip;
        const image = viewingHist ? (hist[state.versionIndex].image || "") : shot.image;
        if (clip) {
          media = document.createElement("video");
          media.controls = true; media.playsInline = true; media.preload = "metadata";
          media.src = safePath(clip);
          if (image) media.poster = safePath(image);
          media.addEventListener("ended", () => { if (state.autoplay) nextShot(); });
          stage.append(media);
        } else if (image) {
          media = document.createElement("img");
          media.src = safePath(image);
          media.alt = "";
          stage.append(media);
        }
        const meta = document.createElement("div");
        meta.className = "stage-meta";
        const no = document.createElement("span");
        no.className = "no"; no.textContent = "分镜 " + (shot.id || "");
        const name = document.createElement("span");
        name.className = "name"; name.textContent = (viewingHist ? "旧版 · " : "") + (shot.title || "未命名");
        meta.append(no, name);
        if (shot.status) {
          const pill = document.createElement("span");
          pill.className = "pill s-" + shot.status;
          pill.textContent = shot.status;
          meta.append(pill);
        }
        if (shot.action) {
          const d = document.createElement("span");
          d.className = "desc"; d.textContent = shot.action;
          meta.append(d);
        }
        stage.append(meta);

        if (hist.length) {
          const bar = document.createElement("div");
          bar.className = "version-bar";
          const lbl = document.createElement("span");
          lbl.className = "lbl"; lbl.textContent = "版本";
          bar.append(lbl);
          const cur = document.createElement("button");
          cur.type = "button";
          cur.className = "vchip" + (state.versionIndex === -1 ? " on" : "");
          cur.textContent = "当前";
          cur.addEventListener("click", () => { state.versionIndex = -1; renderStage(); renderPanel(); });
          bar.append(cur);
          hist.forEach((h, i) => {
            const v = document.createElement("button");
            v.type = "button";
            v.className = "vchip" + (state.versionIndex === i ? " on" : "");
            v.textContent = "v" + (i + 2);
            const vd = document.createElement("span");
            vd.className = "vdate"; vd.textContent = h.date || "";
            v.append(vd);
            v.addEventListener("click", () => { state.versionIndex = i; renderStage(); renderPanel(); });
            bar.append(v);
          });
          if (viewingHist && hist[state.versionIndex].note) {
            const note = document.createElement("span");
            note.className = "lbl"; note.textContent = hist[state.versionIndex].note;
            bar.append(note);
          }
          stage.append(bar);
        }
      } else {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = (p.shots || []).length ? "选择下方胶片条开始审片。" : "这个项目还没有登记分镜。";
        stage.append(empty);
      }
    } else {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "这个项目还没有成片。";
      stage.append(empty);
    }
  }

  function renderFilmstrip() {
    const strip = $("#filmstrip");
    const label = $("#filmstrip-label");
    const p = projectOf();
    const shots = p.shots || [];
    strip.replaceChildren();
    const show = state.mode === "shots" && shots.length > 0;
    strip.hidden = !show;
    label.hidden = !show;
    if (!show) return;

    const stats = $("#shot-stats");
    const passed = shots.filter((s) => s.status === "pass" || s.status === "approve").length;
    const reviewing = shots.filter((s) => s.status === "review" || s.status === "draft").length;
    const rejected = shots.filter((s) => s.status === "rejected").length;
    stats.replaceChildren();
    stats.hidden = !(passed || reviewing || rejected);
    if (passed) {
      const b1 = document.createElement("b"); b1.textContent = `通过 ${passed}`;
      stats.append(b1);
    }
    if (reviewing) {
      const i1 = document.createElement("i"); i1.textContent = `${passed ? " · " : ""}待审 ${reviewing}`;
      stats.append(i1);
    }
    if (rejected) {
      const r = document.createElement("span"); r.textContent = ` · 退回 ${rejected}`;
      stats.append(r);
    }

    const ab = $("#autoplay-btn");
    ab.classList.toggle("on", state.autoplay);
    ab.textContent = state.autoplay ? "连播中" : "连播";

    shots.forEach((shot, i) => {
      const f = document.createElement("button");
      f.type = "button";
      f.className = "frame" + (i === state.shotIndex ? " on" : "") + (shot.clip ? " hasclip" : "") + (shot.status === "rejected" ? " s-rejected" : "");
      const img = document.createElement("img");
      img.src = safePath(shot.image || shot.clip);
      img.alt = shot.title || shot.id || "";
      img.loading = "lazy";
      const tag = document.createElement("div");
      tag.className = "tag";
      const b = document.createElement("b");
      b.textContent = shot.id || String(i + 1);
      const dot = document.createElement("span");
      dot.className = "clipdot";
      tag.append(b, dot);
      f.append(img, tag);
      f.addEventListener("click", () => { selectShot(i); });
      strip.append(f);
    });
    const cur = strip.children[state.shotIndex];
    if (cur) cur.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  /* ---- 侧栏 ---- */
  function renderPanel() {
    const panel = $("#panel");
    panel.replaceChildren();
    const p = projectOf();
    const a = agentOf();
    if (!p || !p.name) return;

    // 项目信息
    const info = document.createElement("div");
    info.className = "card";
    info.innerHTML = "<h4>项目信息</h4>";
    const kv = (k, v) => {
      const row = document.createElement("div");
      row.className = "kv";
      row.innerHTML = "<b>" + k + "</b><span></span>";
      row.lastChild.textContent = v || "—";
      return row;
    };
    info.append(kv("Agent", a.name || a.id));
    if (a.role) info.append(kv("角色", a.role));
    info.append(kv("分镜", (p.shots || []).length + " 镜"));
    if (p.film) info.append(kv("成片", "已出"));
    if (p.note) info.append(kv("说明", p.note));
    if (a.skill_entry) {
      const row = kv("技能", "");
      const link = document.createElement("a");
      link.href = `${REPO}/blob/main/${a.skill_entry}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = a.skill_entry.replace("skills/", "").replace("/SKILL.md", "");
      row.lastChild.append(link);
      info.append(row);
    }
    panel.append(info);

    if (state.mode === "shots" && currentShot()) {
      panel.append(shotOpsCard(a, p, currentShot()));
      panel.append(feedbackCard(a, p, "shot-" + currentShot().id, `分镜 ${currentShot().id} 审片意见`));
    } else if (state.mode === "film" && p.film) {
      panel.append(feedbackCard(a, p, "film", "成片评价"));
    }
    renderProcess();
  }

  /* 改这镜 / 后插一镜：内联表单，写入路径与原总览页完全一致 */
  function shotOpsCard(agent, project, shot) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = "<h4>分镜操作</h4>";
    const actions = document.createElement("div");
    actions.className = "actions";
    const replaceBtn = document.createElement("button");
    replaceBtn.type = "button";
    replaceBtn.className = "btn btn-small";
    replaceBtn.textContent = "改这镜";
    const insertBtn = document.createElement("button");
    insertBtn.type = "button";
    insertBtn.className = "btn btn-small";
    insertBtn.textContent = "后插一镜";
    actions.append(replaceBtn, insertBtn);
    card.append(actions);

    function openForm(mode) {
      card.querySelectorAll(".mform").forEach((f) => f.remove());
      const form = document.createElement("div");
      form.className = "mform";
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
      row.className = "row";
      const submitBtn = document.createElement("button");
      submitBtn.type = "button";
      submitBtn.className = "btn btn-small primary";
      submitBtn.textContent = "提交";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn btn-small";
      cancelBtn.textContent = "取消";
      cancelBtn.addEventListener("click", () => form.remove());
      row.append(submitBtn, cancelBtn);
      form.append(row);
      card.append(form);

      submitBtn.addEventListener("click", () => {
        const file = fileInput.files && fileInput.files[0];
        const manualPath = pathInput.value.trim();
        if (!file && !manualPath) { flashButton(submitBtn, "选文件或填路径"); return; }
        if (file && file.size > 25 * 1024 * 1024) { flashButton(submitBtn, "超过 25MB，请让 agent 上传后填路径"); return; }
        submitBtn.disabled = true;
        submitBtn.textContent = "提交中…";
        fetch(GH_API_BASE + "data.json", { headers: ghHeaders() })
          .then((response) => {
            if (!response.ok) return Promise.reject(new Error(`读取 data.json 失败 ${response.status}`));
            return response.json();
          })
          .then((file42) => {
            const remote = JSON.parse(decodeBase64Utf8(file42.content));
            const entry = remote.board.find((item) => item.id === agent.id);
            const proj = entry && entry.projects && entry.projects.find((pr) => pr.name === project.name);
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
            return upload.then((clipPath) =>
              updateDataJson((data) => {
                const entry2 = data.board.find((item) => item.id === agent.id);
                const proj2 = entry2 && entry2.projects && entry2.projects.find((pr) => pr.name === project.name);
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
            state.versionIndex = -1;
            renderAll();
          })
          .catch((error) => { flashButton(submitBtn, error.message || "提交失败，重试"); })
          .finally(() => { submitBtn.disabled = false; submitBtn.textContent = "提交"; });
      });
    }
    replaceBtn.addEventListener("click", () => openForm("replace"));
    insertBtn.addEventListener("click", () => openForm("insert"));
    return card;
  }

  function feedbackCard(agent, project, target, title) {
    const key = feedbackKey(agent, project, target);
    const card = document.createElement("div");
    card.className = "card";
    const h = document.createElement("h4");
    h.textContent = title;
    card.append(h);
    const box = document.createElement("div");
    box.className = "fbox";
    const row = document.createElement("div");
    row.className = "frow";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "写一句评价，回车提交";
    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "btn btn-small primary";
    submit.textContent = "提交";
    row.append(input, submit);
    const list = document.createElement("div");
    list.className = "flist";

    function drawList() {
      list.replaceChildren();
      (state.feedback[key] || []).forEach((entry) => {
        const item = document.createElement("div");
        item.className = "fentry" + (entry.handled ? " handled" : "");
        const meta = document.createElement("div");
        meta.className = "fmeta";
        const state1 = document.createElement("span");
        state1.className = entry.handled ? "done" : "todo";
        state1.textContent = entry.handled ? "已处理" : "待处理";
        meta.append(document.createTextNode(`${entry.date || ""} · `), state1);
        const body = document.createElement("div");
        body.textContent = entry.text || "";
        item.append(meta, body);
        if (entry.result) {
          const r = document.createElement("div");
          r.className = "fresult";
          r.textContent = `处理结果：${entry.result}`;
          item.append(r);
        }
        list.append(item);
      });
    }

    function submitFeedback() {
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      const entry = {
        agent: agent.id || "agent",
        project: project.name || "项目",
        target,
        targetLabel: title,
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
          flashButton(submit, "已入库");
        },
        () => { input.focus(); flashButton(submit, "提交失败，重试"); },
      ).finally(() => { submit.disabled = false; submit.textContent = "提交"; });
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
    card.append(box);
    return card;
  }

  function renderProcess() {
    const root = $("#process");
    root.replaceChildren();
    const p = projectOf();
    if (!(p.steps || []).length) return;
    const h = document.createElement("h3");
    h.textContent = "制作过程";
    root.append(h);
    p.steps.forEach((s, i) => {
      const d = document.createElement("details");
      d.className = "proc";
      const sum = document.createElement("summary");
      const idx = document.createElement("span");
      idx.className = "idx";
      idx.textContent = String(i + 1).padStart(2, "0");
      sum.append(idx, document.createTextNode(s.title || "步骤 " + (i + 1)));
      const body = document.createElement("p");
      body.textContent = s.body || "";
      d.append(sum, body);
      root.append(d);
    });
  }

  /* ---- 交互 ---- */
  function selectShot(i) {
    state.shotIndex = i;
    state.versionIndex = -1;
    renderStage();
    renderFilmstrip();
    renderPanel();
  }
  function nextShot() {
    const shots = projectOf().shots || [];
    if (state.shotIndex < shots.length - 1) selectShot(state.shotIndex + 1);
  }
  function prevShot() {
    if (state.shotIndex > 0) selectShot(state.shotIndex - 1);
  }

  document.addEventListener("keydown", (event) => {
    if (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (event.key === "ArrowRight") { event.preventDefault(); nextShot(); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); prevShot(); }
    else if (event.key === " ") {
      const v = $("#stage video");
      if (v) {
        event.preventDefault();
        if (v.paused) v.play(); else v.pause();
      }
    }
  });

  $("#autoplay-btn").addEventListener("click", () => {
    state.autoplay = !state.autoplay;
    localStorage.setItem("vl-autoplay", state.autoplay ? "1" : "0");
    renderFilmstrip();
  });
  $("#tab-film").addEventListener("click", () => { state.mode = "film"; state.versionIndex = -1; renderAll(); });
  $("#tab-shots").addEventListener("click", () => { state.mode = "shots"; state.versionIndex = -1; renderAll(); });

  function renderAll() {
    renderCuebar();
    renderChips();
    renderStage();
    renderFilmstrip();
    renderPanel();
  }

  /* ---- 启动 ---- */
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
      const first = state.board.findIndex(hasStuff);
      if (first >= 0) state.agentIndex = first;
      renderAll();
    })
    .catch(() => {
      $("#stage").innerHTML = '<div class="empty">暂时无法读取项目数据，请稍后刷新。</div>';
    });
})();
