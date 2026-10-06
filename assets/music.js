(function () {
  const BASE = "/video-lab/";
  const GH_API_BASE = "https://api.github.com/repos/Q-1844/video-lab/contents/";
  const state = { tracks: [] };

  const $ = (selector, root = document) => root.querySelector(selector);

  // ---- 内置 token（与 app.js 同一套解码方式） ----
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
      if (typeof VIDEO_LAB_CONFIG === "undefined" || !VIDEO_LAB_CONFIG.feedbackToken) return "";
      return decodeBuiltinToken(VIDEO_LAB_CONFIG);
    } catch (error) {
      return "";
    }
  }

  function ghHeaders() {
    return {
      Authorization: `Bearer ${ghToken()}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
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

  function safePath(path) {
    if (!path) return "";
    return path.startsWith("/") || path.startsWith("http") ? path : BASE + path;
  }

  function flashButton(button, message) {
    const original = button.textContent;
    button.textContent = message;
    setTimeout(() => { button.textContent = original; }, 2200);
  }

  function downloadLink(href, filename, label) {
    const link = document.createElement("a");
    link.className = "btn btn-small";
    link.href = href;
    link.download = filename;
    link.textContent = label;
    return link;
  }

  // ---- 渲染 ----
  function trackCard(track) {
    const card = document.createElement("article");
    card.className = "track-card";
    const head = document.createElement("div");
    head.className = "track-head";
    const title = document.createElement("h4");
    title.textContent = track.title || "未命名曲目";
    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = [track.author || "灵光", track.style, track.date].filter(Boolean).join(" · ");
    head.append(title, meta);
    card.append(head);
    if (track.note) {
      const note = document.createElement("p");
      note.textContent = track.note;
      card.append(note);
    }
    if (track.src) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "metadata";
      audio.src = safePath(track.src);
      audio.addEventListener("error", () => {
        const err = document.createElement("p");
        err.className = "aerr";
        err.textContent = "音频文件缺失：";
        const path = document.createElement("code");
        path.textContent = track.src;
        err.append(path);
        audio.replaceWith(err);
      });
      card.append(audio);
      const links = document.createElement("div");
      links.className = "button-row";
      links.append(downloadLink(safePath(track.src), `${track.title || "track"}.mp3`, "下载音频"));
      card.append(links);
    }
    (Array.isArray(track.mvs) ? track.mvs : []).forEach((mv) => {
      const item = document.createElement("div");
      item.className = "mv-item";
      const mvMeta = document.createElement("p");
      mvMeta.className = "meta";
      mvMeta.textContent = `MV · ${[mv.title, mv.project, mv.date].filter(Boolean).join(" · ")}`;
      item.append(mvMeta);
      if (mv.note) {
        const note = document.createElement("p");
        note.textContent = mv.note;
        item.append(note);
      }
      if (mv.video) {
        const video = document.createElement("video");
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.src = safePath(mv.video);
        item.append(video);
        const links = document.createElement("div");
        links.className = "button-row";
        links.append(downloadLink(safePath(mv.video), `${mv.title || "mv"}.mp4`, "下载 MV"));
        item.append(links);
      }
      card.append(item);
    });
    return card;
  }

  function render() {
    const grid = $("#track-grid");
    grid.replaceChildren();
    $("#music-stats").textContent = `曲库 ${state.tracks.length} 首${state.tracks.some((t) => (t.mvs || []).length) ? " · 含 MV" : ""}`;
    if (!state.tracks.length) {
      grid.innerHTML = '<p class="empty-state">曲库还是空的，用下面的表单传第一首。</p>';
      return;
    }
    state.tracks.forEach((track) => grid.append(trackCard(track)));
  }

  // ---- 上传表单：选文件（≤25MB）或填路径，回车即提交 ----
  function renderUpload() {
    const root = $("#music-upload");
    root.replaceChildren();
    if (!ghToken()) {
      root.innerHTML = '<p class="empty-state">没有可用 token，暂时只能展示，不能上传。</p>';
      return;
    }
    const form = document.createElement("div");
    form.className = "shot-form";
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "曲目标题（必填）";
    const styleInput = document.createElement("input");
    styleInput.type = "text";
    styleInput.placeholder = "风格 / 情绪（可选）";
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.placeholder = "备注（可选）";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/*";
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (file && !titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || file.name;
      }
    });
    const pathInput = document.createElement("input");
    pathInput.type = "text";
    pathInput.placeholder = "或填仓库内音频路径（agent 已上传时），如 music/tracks/xx.mp3";
    const row = document.createElement("div");
    row.className = "button-row";
    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "btn btn-small";
    submitBtn.textContent = "提交";
    row.append(submitBtn);
    form.append(titleInput, styleInput, noteInput, fileInput, pathInput, row);
    root.append(form);

    function submit() {
      const title = titleInput.value.trim();
      const file = fileInput.files && fileInput.files[0];
      const manualPath = pathInput.value.trim();
      if (!title) {
        flashButton(submitBtn, "先填标题");
        titleInput.focus();
        return;
      }
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
      const trackTitle = title;

      // 远端重名检查 + music.json 最新 sha，一切以远端为准
      const rawName = file ? file.name : manualPath.split("/").pop() || `${title}.mp3`;
      const safeName = rawName.replace(/\s+/g, "-");

      fetch(GH_API_BASE + "music/tracks/" + safeName, { headers: ghHeaders() })
        .then((check) => {
          if (!file) {
            if (check.status === 200) return Promise.reject(new Error("同名文件已在仓库里"));
            return Promise.resolve(manualPath);
          }
          let uploadPath = `music/tracks/${safeName}`;
          if (check.status === 200) {
            const dot = safeName.lastIndexOf(".");
            uploadPath = `music/tracks/${safeName.slice(0, dot)}-${Date.now()}${safeName.slice(dot)}`;
          }
          return fileToBase64(file).then((base64) =>
            ghPutFile(uploadPath, base64, null, `上传音乐：${trackTitle} → ${uploadPath}`).then(() => uploadPath));
        })
        .then((src) => updateMusicJson(src))
        .then((data) => {
          state.tracks = Array.isArray(data.tracks) ? data.tracks : [];
          render();
          [titleInput, styleInput, noteInput, pathInput].forEach((input) => { input.value = ""; });
          fileInput.value = "";
        })
        .catch((error) => {
          flashButton(submitBtn, error.message || "提交失败，重试");
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "提交";
        });
    }

    function updateMusicJson(src) {
      const trackTitle = titleInput.value.trim();
      return fetch(GH_API_BASE + "music/music.json", { headers: ghHeaders() })
        .then((response) => {
          if (response.status === 404) return null; // 远端还没有 music.json：首次入库，自动创建
          if (!response.ok) return Promise.reject(new Error(`读取 music.json 失败 ${response.status}`));
          return response.json();
        })
        .then((file) => {
          const data = file ? JSON.parse(decodeBase64Utf8(file.content)) : { tracks: [] };
          data.tracks = Array.isArray(data.tracks) ? data.tracks : [];
          data.updated = new Date().toISOString().slice(0, 10);
          data.tracks.unshift({
            id: `m${Date.now()}`,
            title: trackTitle,
            author: "灵光",
            style: styleInput.value.trim(),
            note: noteInput.value.trim(),
            src,
            date: new Date().toISOString().slice(0, 10),
            mvs: [],
          });
          return ghPutFile("music/music.json", encodeBase64Utf8(JSON.stringify(data, null, 2) + "\n"), file ? file.sha : null, `音乐入库：${trackTitle}`)
            .then(() => data);
        });
    }

    submitBtn.addEventListener("click", submit);
    [titleInput, styleInput, noteInput, pathInput].forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit();
        }
      });
    });
  }

  fetch(`${BASE}music/music.json?ts=${Date.now()}`)
    .then((response) => (response.ok ? response.json() : { tracks: [] }))
    .catch(() => ({ tracks: [] }))
    .then((data) => {
      state.tracks = Array.isArray(data.tracks) ? data.tracks : [];
      render();
      renderUpload();
    });
})();
