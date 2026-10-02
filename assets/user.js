(function () {
  const DB_NAME = "video-lab-user-inbox";
  const STORE = "uploads";
  const list = document.querySelector("#upload-list");
  const fileInput = document.querySelector("#file");
  const noteInput = document.querySelector("#note");
  const drop = document.querySelector(".drop");
  let db;

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  function transaction(mode, action) {
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, mode).objectStore(STORE);
      action(request, resolve, reject);
    });
  }

  function allItems() {
    return transaction("readonly", (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
      request.onerror = () => reject(request.error);
    });
  }

  function addItem(item) {
    return transaction("readwrite", (store, resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  function removeItem(id) {
    return transaction("readwrite", (store, resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
  }

  function button(text, className, handler) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `btn btn-small ${className || ""}`;
    b.textContent = text;
    b.addEventListener("click", handler);
    return b;
  }

  // 释放列表里所有已挂起的 objectURL，避免重复渲染累积内存
  function revokeUrls() {
    list.querySelectorAll("[data-url]").forEach((el) => {
      try { URL.revokeObjectURL(el.dataset.url); } catch (e) { /* 忽略已失效的 URL */ }
      delete el.dataset.url;
    });
  }

  function render(items) {
    revokeUrls();
    list.replaceChildren();
    if (!items.length) {
      list.innerHTML = '<p class="empty-state">还没有上传内容。上传后会保存在当前浏览器中。</p>';
      return;
    }
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card upload-card";
      const title = document.createElement("h2");
      title.textContent = item.name;
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = `${item.type || "未知类型"} · ${new Date(item.createdAt).toLocaleString()}`;
      card.append(title, meta);
      const url = URL.createObjectURL(item.blob);
      const media = item.type.startsWith("image/") ? document.createElement("img") : document.createElement("video");
      media.src = url;
      media.alt = item.name;
      media.dataset.url = url;
      if (media.tagName === "VIDEO") {
        media.controls = true;
        media.playsInline = true;
        media.preload = "metadata";
      }
      card.append(media);
      if (item.note) {
        const note = document.createElement("p");
        note.textContent = item.note;
        card.append(note);
      }
      const actions = document.createElement("div");
      actions.className = "button-row";
      actions.append(button("下载素材", "", () => {
        const link = document.createElement("a");
        link.href = url;
        link.download = item.name;
        link.click();
      }));
      actions.append(button("删除", "danger", async () => {
        await removeItem(item.id);
        render(await allItems());
      }));
      card.append(actions);
      list.append(card);
    });
  }

  async function ingest(files) {
    const note = noteInput.value.trim();
    for (const file of files) {
      await addItem({ id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size, note, blob: file, createdAt: Date.now() });
    }
    noteInput.value = "";
    fileInput.value = "";
    render(await allItems());
  }

  function previewTemporary(files) {
    [...files].forEach((file) => {
      const card = document.createElement("article");
      card.className = "card";
      const title = document.createElement("h2");
      title.textContent = file.name;
      const media = file.type.startsWith("image/") ? document.createElement("img") : document.createElement("video");
      media.src = URL.createObjectURL(file);
      media.dataset.url = media.src; // 供下一次 render/ingest 时 revoke
      if (media.tagName === "VIDEO") { media.controls = true; media.playsInline = true; }
      card.append(title, media);
      list.prepend(card);
    });
  }

  fileInput.addEventListener("change", (event) => {
    if (!db) return previewTemporary(event.target.files);
    ingest([...event.target.files]).catch(() => alert("保存失败，请检查浏览器是否允许本地存储。"));
  });
  ["dragenter", "dragover"].forEach((eventName) => drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach((eventName) => drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.remove("dragging");
  }));
  drop.addEventListener("drop", (event) => {
    if (!db) return previewTemporary(event.dataTransfer.files);
    ingest([...event.dataTransfer.files]).catch(() => alert("保存失败，请检查浏览器是否允许本地存储。"));
  });

  openDb().then(allItems).then(render).catch(() => {
    list.innerHTML = '<p class="empty-state">当前浏览器不支持持久化上传，但仍可选择文件临时预览。</p>';
  });
})();
