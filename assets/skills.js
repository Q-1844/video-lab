(function () {
  const BASE = "/video-lab/";
  const REPO = "https://github.com/Q-1844/video-lab";
  const state = { skills: [], board: [] };

  const $ = (selector, root = document) => root.querySelector(selector);

  function ghBlob(path) {
    return `${REPO}/blob/main/${path}`;
  }

  function ghTree(dir) {
    return `${REPO}/tree/main/${dir}`;
  }

  function agentLabel(agent) {
    return agent.name || agent.label || agent.id || "未命名 Agent";
  }

  // 谁在用这个技能：Agent 级（skill_entry / skills 数组）+ 项目级（project.skill）
  function usedBy(skill) {
    const names = [];
    state.board.forEach((agent) => {
      const entries = [agent.skill_entry, ...(agent.skills || [])].filter(Boolean);
      if (entries.includes(skill.entry)) names.push(agentLabel(agent));
      (agent.projects || []).forEach((project) => {
        if (project.skill === skill.id) names.push(`${agentLabel(agent)} · ${project.name}`);
      });
    });
    return [...new Set(names)];
  }

  function badge(text, type) {
    const el = document.createElement("span");
    el.className = `badge badge-${type}`;
    el.textContent = text;
    return el;
  }

  function fileRow(label, desc, path) {
    const li = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = label;
    const note = document.createElement("span");
    note.className = "muted";
    note.textContent = desc || "";
    const link = document.createElement("a");
    link.className = "file-link";
    link.href = ghBlob(path);
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "查看";
    li.append(name, note, link);
    return li;
  }

  function card(skill) {
    const el = document.createElement("article");
    el.className = `skill-card skill-${skill.type || "repo"}`;

    const head = document.createElement("div");
    head.className = "skill-head";
    const title = document.createElement("h2");
    title.textContent = skill.name || skill.id;
    head.append(badge(skill.status || skill.type || "—", skill.type || "repo"), title);
    if (skill.version && skill.version !== "未开始" && skill.version !== "外部") {
      const version = document.createElement("span");
      version.className = "badge badge-plain";
      version.textContent = skill.version;
      head.append(version);
    }
    el.append(head);

    if (skill.summary) {
      const summary = document.createElement("p");
      summary.className = "sub";
      summary.textContent = skill.summary;
      el.append(summary);
    }

    if (skill.type === "repo") {
      const moduleKicker = document.createElement("p");
      moduleKicker.className = "kicker";
      moduleKicker.textContent = "modules";
      const files = document.createElement("ul");
      files.className = "skill-files";
      if (skill.entry) files.append(fileRow("入口 SKILL.md", "所有 Agent 的统一加载入口", skill.entry));
      if (skill.guide) files.append(fileRow("GUIDE", "使用指南与版本说明", skill.guide));
      (skill.modules || []).forEach((m) => files.append(fileRow(m.label || m.id, m.desc, m.path)));
      el.append(moduleKicker, files);

      if (skill.references && skill.references.length) {
        const details = document.createElement("details");
        details.className = "skill-refs";
        const summary = document.createElement("summary");
        summary.textContent = `参考文件 ${skill.references.length} 份`;
        const refs = document.createElement("ul");
        refs.className = "skill-files";
        skill.references.forEach((r) => refs.append(fileRow(r.label || r.path, "", r.path)));
        details.append(summary, refs);
        el.append(details);
      }
    }

    const users = usedBy(skill);
    if (users.length) {
      const row = document.createElement("p");
      row.className = "skill-users";
      const kicker = document.createElement("span");
      kicker.className = "kicker";
      kicker.textContent = "used by";
      row.append(kicker);
      users.forEach((name) => row.append(badge(name, "user")));
      el.append(row);
    }

    if (skill.dir) {
      const link = document.createElement("a");
      link.className = "btn btn-small";
      link.href = ghTree(skill.dir);
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "查看 GitHub 目录";
      el.append(link);
    }

    return el;
  }

  function stats() {
    const count = (type) => state.skills.filter((s) => s.type === type).length;
    const el = $("#skill-stats");
    el.replaceChildren(
      `共 ${state.skills.length} 项：仓库内 ${count("repo")} · 外部来源 ${count("external")} · 计划中 ${count("planned")}`
    );
  }

  function render() {
    stats();
    const grid = $("#skill-grid");
    grid.replaceChildren();
    // 仓库内技能在前，外部标记次之，计划中垫底
    const order = { repo: 0, external: 1, planned: 2 };
    state.skills
      .slice()
      .sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9))
      .forEach((skill) => grid.append(card(skill)));
    if (!state.skills.length) {
      grid.innerHTML = '<p class="empty-state">skills/skills.json 还没有登记任何技能。</p>';
    }
  }

  Promise.all([
    fetch(`${BASE}skills/skills.json?ts=${Date.now()}`).then((r) => r.json()),
    fetch(`${BASE}data.json?ts=${Date.now()}`).then((r) => r.json())
  ])
    .then(([registry, data]) => {
      state.skills = Array.isArray(registry.skills) ? registry.skills : [];
      state.board = Array.isArray(data.board) ? data.board : [];
      render();
    })
    .catch(() => {
      $("#skill-grid").innerHTML = '<p class="empty-state">暂时无法读取技能数据，请稍后刷新。</p>';
    });
})();
