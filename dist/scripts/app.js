const els = {
  toolsGrid: document.getElementById("tools-grid"),
  toolsEmpty: document.getElementById("tools-empty"),
  toolsCategories: document.getElementById("tools-categories"),
  toolsFeatured: document.getElementById("tools-featured"),
  toolsCount: document.getElementById("tools-count"),
  logsList: document.getElementById("logs-list"),
  logsEmpty: document.getElementById("logs-empty"),
  profileCard: document.getElementById("profile-card"),
  profileEmpty: document.getElementById("profile-empty"),
  search: document.getElementById("tools-search"),
  filter: document.getElementById("tools-filter"),
  clear: document.getElementById("tools-clear"),
  shareBtn: document.getElementById("share-btn"),
  qrBtn: document.getElementById("qr-btn"),
  qrModal: document.getElementById("qr-modal"),
  qrCanvas: document.getElementById("qr-canvas"),
  qrClose: document.getElementById("qr-close"),
  qrDownload: document.getElementById("qr-download"),
  themeBtn: document.getElementById("theme-btn"),
  themeMenu: document.getElementById("theme-menu"),
  cardDownload: document.getElementById("card-download"),
  toast: document.getElementById("toast"),
  logsExpandAll: document.getElementById("logs-expand-all")
};

const state = {
  tools: [],
  logs: [],
  profile: null,
  search: "",
  filter: ""
};

const track = (event, data = {}) => {
  if (window.umami && typeof window.umami.track === "function") {
    window.umami.track(event, data);
  }
};

const showNotice = (el, message) => {
  el.textContent = message;
  el.style.display = "block";
};

const showToast = (message) => {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2200);
};

const clearNotice = (el) => {
  el.textContent = "";
  el.style.display = "none";
};

const fetchJson = async (url, label) => {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    track("data_load_error", { section: label, reason: String(err) });
    throw new Error(`${label} 加载失败：${err.message || err}`);
  }
};

const escapeHtml = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const splitKeywords = (query) =>
  query
    .split(/\s+/)
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 5);

const highlight = (text, query) => {
  if (!query) return escapeHtml(text);
  const safe = escapeHtml(text);
  const keywords = splitKeywords(query);
  if (!keywords.length) return safe;
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "ig");
  return safe.replace(regex, (m) => `<mark class="hl">${m}</mark>`);
};

const renderTools = () => {
  if (!state.tools.length && !state.search) {
    showNotice(
      els.toolsEmpty,
      "工具导航：数据为空。请检查 public/data/tools.json，补充 items 列表。"
    );
    return;
  }

  if (els.toolsFeatured && !els.toolsFeatured.hasChildNodes()) {
    const featured = state.tools.filter((t) => t.featured).slice(0, 6);
    if (featured.length) {
      featured.forEach((tool) => {
        const chip = document.createElement("span");
        chip.className = "pill";
        chip.textContent = `推荐：${tool.name}`;
        els.toolsFeatured.appendChild(chip);
      });
    }
  }

  if (els.toolsCategories && !els.toolsCategories.hasChildNodes()) {
    const categories = state.tools.reduce((set, tool) => {
      (tool.tags || []).forEach((tag) => set.add(tag));
      if (tool.category) set.add(tool.category);
      return set;
    }, new Set());

    Array.from(categories).slice(0, 10).forEach((cat) => {
      const chip = document.createElement("span");
      chip.className = "pill";
      chip.textContent = `#${cat}`;
      els.toolsCategories.appendChild(chip);
    });
  }

  const list = state.tools.filter((tool) => {
    if (!state.search) return true;
    const text = `${tool.name} ${tool.description} ${(tool.tags || []).join(" ")}`.toLowerCase();
    const keywords = splitKeywords(state.search.toLowerCase());
    return keywords.every((k) => text.includes(k));
  }).filter((tool) => {
    if (!state.filter) return true;
    const categories = tool.category ? [tool.category] : tool.tags || [];
    return categories.includes(state.filter);
  }).sort((a, b) => (b.weight || 0) - (a.weight || 0));

  if (els.toolsCount) {
    const total = state.tools.length;
    const shown = list.length;
    els.toolsCount.textContent = state.search ? `匹配 ${shown}/${total}` : `共 ${total} 个`;
  }

  els.toolsGrid.innerHTML = "";

  if (!list.length) {
    const tips = state.search
      ? `工具导航：未找到“${state.search}”。建议尝试更短关键词或检查拼写。`
      : "工具导航：未找到匹配工具。请检查工具数据。";
    showNotice(els.toolsEmpty, tips);
    if (state.search) track("search_empty", { search_keyword: state.search });
    return;
  }

  clearNotice(els.toolsEmpty);

  list.forEach((tool) => {
    const card = document.createElement("a");
    card.className = "tool-card";
    card.href = tool.url;
    card.target = "_blank";
    card.rel = "noreferrer";

    const iconWrap = document.createElement("div");
    iconWrap.className = "icon";

    const iconImg = document.createElement("img");
    iconImg.src = tool.icon || "";
    iconImg.alt = tool.name;
    iconImg.width = 28;
    iconImg.height = 28;
    iconImg.loading = "lazy";
    iconImg.onerror = () => {
      iconWrap.textContent = "?";
      const reason = `工具“${tool.name}”图标加载失败，请检查 icon URL。`;
      showNotice(els.toolsEmpty, reason);
    };

    iconWrap.appendChild(iconImg);

    const name = document.createElement("div");
    name.innerHTML = highlight(tool.name, state.search);
    name.style.fontWeight = "600";

    const desc = document.createElement("div");
    desc.innerHTML = highlight(tool.description, state.search);
    desc.style.color = "var(--muted)";
    desc.style.fontSize = "0.92rem";

    const tags = document.createElement("div");
    tags.className = "tags";
    (tool.tags || []).forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.innerHTML = highlight(`#${tag}`, state.search);
      tags.appendChild(span);
    });

    const cta = document.createElement("div");
    cta.textContent = "访问链接";
    cta.style.color = "var(--accent)";
    cta.style.fontWeight = "600";
    cta.style.marginTop = "6px";

    card.append(iconWrap, name, desc, tags, cta);
    card.addEventListener("click", () => track("tool_click", { tool_name: tool.name }));

    els.toolsGrid.appendChild(card);
  });
};

const renderLogs = () => {
  els.logsList.innerHTML = "";
  if (!state.logs.length) {
    showNotice(els.logsEmpty, "学习日志：暂无内容，请先补充 logs.json。此处为空不会影响使用。");
    return;
  }
  clearNotice(els.logsEmpty);

  let openDetail = null;
  let storedOpen = null;
  try {
    const raw = localStorage.getItem("log_open_index");
    storedOpen = raw === null ? null : Number(raw);
  } catch (e) {
    storedOpen = null;
  }
  const hashTarget = window.location.hash.replace("#", "");

  const sortedLogs = [...state.logs].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    const ad = Date.parse(a.date || "") || 0;
    const bd = Date.parse(b.date || "") || 0;
    return bd - ad;
  });

  sortedLogs.forEach((log, index) => {
    const card = document.createElement("div");
    card.className = "log-card";
    const anchorId = `log-${index + 1}`;
    card.id = anchorId;

    const title = document.createElement("div");
    title.textContent = log.title;
    title.style.fontWeight = "600";

    const meta = document.createElement("div");
    meta.className = "log-meta";
    meta.innerHTML = `<span>${log.date}</span><span>第 ${index + 1} 条</span>`;

    if (log.pinned) {
      const pin = document.createElement("span");
      pin.className = "badge";
      pin.textContent = "置顶";
      meta.appendChild(pin);
    }

    const ul = document.createElement("ul");
    (log.bullets || []).forEach((b) => {
      const li = document.createElement("li");
      li.textContent = b;
      ul.appendChild(li);
    });

    const rel = document.createElement("div");
    rel.textContent = `关联工具：${(log.relatedTools || []).join(" / ")}`;
    rel.style.color = "var(--muted)";
    rel.style.fontSize = "0.9rem";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = "展开";

    const detail = document.createElement("div");
    detail.className = "log-detail";
    detail.style.marginTop = "8px";
    detail.style.color = "var(--muted)";

    const renderDetail = () => {
      if (!log.details) {
        detail.textContent = "暂无详情";
        return;
      }
      detail.textContent = log.details;
      if (log.links && log.links.length) {
        const links = document.createElement("div");
        links.style.marginTop = "6px";
        links.textContent = `相关链接：${log.links.join(" / ")}`;
        detail.appendChild(links);
      }
    };

    renderDetail();

    if (storedOpen === index || hashTarget === anchorId) {
      detail.classList.add("is-open");
      toggle.textContent = "收起";
      openDetail = detail;
    }

    toggle.addEventListener("click", () => {
      const open = detail.classList.contains("is-open");
      if (openDetail && openDetail !== detail) {
        openDetail.classList.remove("is-open");
        openDetail.parentElement.querySelector("button").textContent = "展开";
      }
      detail.classList.toggle("is-open", !open);
      toggle.textContent = open ? "展开" : "收起";
      openDetail = !open ? detail : null;
      if (!open) track("log_expand", { title: log.title });
      try {
        if (!open) {
          localStorage.setItem("log_open_index", String(index));
        } else {
          localStorage.removeItem("log_open_index");
        }
      } catch (e) {
        // ignore
      }
      if (!open) {
        history.replaceState(null, "", `#${anchorId}`);
      }
    });

    card.append(title, meta, ul, rel, toggle, detail);
    els.logsList.appendChild(card);
  });

  if (els.logsExpandAll) {
    els.logsExpandAll.onclick = () => {
      const opened = els.logsExpandAll.dataset.opened === "true";
      els.logsList.querySelectorAll(".log-detail").forEach((node) => {
        node.classList.toggle("is-open", !opened);
        const btn = node.parentElement.querySelector("button");
        if (btn) btn.textContent = opened ? "展开" : "收起";
      });
      els.logsExpandAll.dataset.opened = opened ? "false" : "true";
      els.logsExpandAll.textContent = opened ? "展开全部" : "收起全部";
      try {
        localStorage.removeItem("log_open_index");
      } catch (e) {
        // ignore
      }
    };
  }
};

const renderProfile = () => {
  if (!state.profile) {
    showNotice(els.profileEmpty, "个人介绍：数据为空。请检查 profile.json。" );
    return;
  }
  clearNotice(els.profileEmpty);

  const { name, avatar, bio, contacts = [], socials = [] } = state.profile;

  els.profileCard.innerHTML = "";

  const img = document.createElement("img");
  img.src = avatar;
  img.alt = name;
  img.onerror = () => {
    showNotice(els.profileEmpty, "个人介绍：头像加载失败，请检查 avatar 路径。");
  };

  const info = document.createElement("div");
  const n = document.createElement("div");
  n.textContent = name;
  n.style.fontSize = "1.4rem";
  n.style.fontWeight = "700";

  const b = document.createElement("div");
  b.textContent = bio;
  b.style.margin = "8px 0";
  b.style.color = "var(--muted)";

  const c = document.createElement("div");
  c.textContent = `联系方式：${contacts.map((item) => `${item.type} ${item.value}`).join(" / ")}`;

  const s = document.createElement("div");
  s.textContent = `社媒链接：${socials.map((item) => item.label).join(" / ")}`;

  info.append(n, b, c, s);
  els.profileCard.append(img, info);
};

const setupSearch = () => {
  let timer;
  const handle = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = els.search.value.trim();
      if (state.search) track("search_used", { search_keyword: state.search });
      renderTools();
    }, 200);
  };
  els.search.addEventListener("input", handle);
  els.search.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      els.search.value = "";
      state.search = "";
      renderTools();
    }
  });
  els.clear.addEventListener("click", () => {
    els.search.value = "";
    state.search = "";
    if (els.filter) {
      els.filter.value = "";
      state.filter = "";
    }
    renderTools();
  });
  if (els.filter) {
    els.filter.addEventListener("change", () => {
      state.filter = els.filter.value;
      track("search_used", { search_filter: state.filter || "all" });
      renderTools();
    });
  }
};

const setupTheme = () => {
  const readTheme = () => {
    try {
      return localStorage.getItem("theme") || "system";
    } catch (e) {
      return "system";
    }
  };

  const updateTheme = (next) => {
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const finalTheme = next === "system" ? system : next;
    document.documentElement.dataset.theme = finalTheme;
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      // ignore
    }
    track("theme_change", { theme: next });
  };

  const updateUI = (current) => {
    els.themeBtn.textContent = `主题:${current}`;
    if (!els.themeMenu) return;
    els.themeMenu.querySelectorAll(".theme-option").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.theme === current);
    });
  };

  const initial = readTheme();
  updateUI(initial);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    const current = readTheme();
    if (current === "system") {
      updateTheme("system");
      showToast("已跟随系统主题");
    }
  });

  els.themeBtn.addEventListener("click", () => {
    els.themeMenu.classList.toggle("is-open");
  });

  if (els.themeMenu) {
    els.themeMenu.addEventListener("click", (e) => {
      const btn = e.target.closest(".theme-option");
      if (!btn) return;
      const next = btn.dataset.theme;
      updateTheme(next);
      updateUI(next);
      els.themeMenu.classList.remove("is-open");
    });
  }

  document.addEventListener("click", (e) => {
    if (!els.themeMenu) return;
    if (!els.themeMenu.contains(e.target) && e.target !== els.themeBtn) {
      els.themeMenu.classList.remove("is-open");
    }
  });
};

const setupShare = () => {
  const url = window.location.href;
  els.shareBtn.addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        showToast("已调起系统分享");
      } else {
        await navigator.clipboard.writeText(url);
        showToast("链接已复制");
      }
      track("share_click");
    } catch (err) {
      showNotice(els.profileEmpty, "分享失败，请手动复制链接。" );
    }
  });
};

const setupQr = () => {
  if (!els.qrBtn || !els.qrModal || !els.qrCanvas) return;
  const url = window.location.href;

  els.qrBtn.addEventListener("click", () => {
    renderQrToCanvas(url, els.qrCanvas, 220);
    els.qrModal.classList.add("is-open");
    els.qrModal.setAttribute("aria-hidden", "false");
  });

  const close = () => {
    els.qrModal.classList.remove("is-open");
    els.qrModal.setAttribute("aria-hidden", "true");
  };

  els.qrClose.addEventListener("click", close);
  els.qrModal.addEventListener("click", (e) => {
    if (e.target === els.qrModal) close();
  });

  if (els.qrDownload) {
    els.qrDownload.addEventListener("click", () => {
      try {
        const link = document.createElement("a");
        link.href = els.qrCanvas.toDataURL("image/png");
        link.download = "zhi-home-qr.png";
        link.click();
        showToast("二维码已下载");
      } catch (e) {
        showNotice(els.profileEmpty, "二维码下载失败，请重试。");
      }
    });
  }
};

const drawCard = async () => {
  if (!state.profile) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#f6b26b");
  grad.addColorStop(1, "#f06c9b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1c0f13";
  ctx.font = "bold 72px Space Grotesk, sans-serif";
  ctx.fillText(state.profile.name || "Zhi", 80, 160);

  ctx.font = "32px Newsreader, serif";
  wrapText(ctx, state.profile.bio || "", 80, 240, 920, 42);

  ctx.font = "28px Space Grotesk, sans-serif";
  ctx.fillText(
    `联系方式：${(state.profile.contacts || []).map((c) => `${c.type} ${c.value}`).join(" / ")}`,
    80,
    400
  );

  ctx.fillText(
    `社媒：${(state.profile.socials || []).map((s) => s.label).join(" / ")}`,
    80,
    450
  );

  if (state.profile.avatar) {
    try {
      const img = await loadImage(state.profile.avatar);
      const size = 220;
      const x = 80;
      const y = 520;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    } catch (e) {
      // ignore avatar errors
    }
  }

  return canvas.toDataURL("image/png");
};

const setupCardDownload = () => {
  els.cardDownload.addEventListener("click", async () => {
    try {
      const dataUrl = await drawCard();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "zhi-card.png";
      link.click();
      showToast("名片已下载");
      track("card_download");
    } catch (err) {
      showNotice(els.profileEmpty, "名片生成失败，请稍后重试。");
    }
  });
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.includes(" ") ? text.split(" ") : text.split("");
  let line = "";
  let offsetY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line, x, offsetY);
      line = words[i] + " ";
      offsetY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, offsetY);
};

const init = async () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.15 }
  );

  try {
    const [profile, tools, logs] = await Promise.all([
      fetchJson("/data/profile.json", "个人介绍"),
      fetchJson("/data/tools.json", "工具导航"),
      fetchJson("/data/logs.json", "学习日志")
    ]);
    state.profile = profile;
    state.tools = tools.items || [];
    if (els.filter && tools.categories) {
      const options = tools.categories;
      options.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        els.filter.appendChild(opt);
      });
    }
    state.logs = logs.items || [];
  } catch (err) {
    showNotice(els.toolsEmpty, err.message);
    showNotice(els.logsEmpty, err.message);
    showNotice(els.profileEmpty, err.message);
  }

  renderTools();
  renderLogs();
  renderProfile();
  setupSearch();
  setupTheme();
  setupShare();
  setupQr();
  setupCardDownload();

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
};

init();

// Minimal QR generator (based on MIT-licensed qrcode-generator, compacted)
function renderQrToCanvas(text, canvas, size) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const count = qr.getModuleCount();
  const cell = Math.floor(size / count);
  const margin = Math.floor((size - cell * count) / 2);
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#111111";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(margin + c * cell, margin + r * cell, cell, cell);
      }
    }
  }
}

function qrcode(typeNumber, errorCorrectionLevel) {
  const PAD0 = 0xec;
  const PAD1 = 0x11;
  const _typeNumber = typeNumber;
  const _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
  let _modules = null;
  let _moduleCount = 0;
  let _dataCache = null;
  const _dataList = [];

  const _this = {};

  _this.addData = function (data) {
    const newData = QR8bitByte(data);
    _dataList.push(newData);
    _dataCache = null;
  };

  _this.isDark = function (row, col) {
    if (_modules[row][col] !== null) {
      return _modules[row][col];
    }
    return false;
  };

  _this.getModuleCount = function () {
    return _moduleCount;
  };

  _this.make = function () {
    if (_typeNumber < 1) {
      let typeNumber = 1;
      for (; typeNumber < 10; typeNumber++) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
        const buffer = QRBitBuffer();
        for (let i = 0; i < _dataList.length; i++) {
          const data = _dataList[i];
          buffer.put(data.getMode(), 4);
          buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
          data.write(buffer);
        }
        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
          totalDataCount += rsBlocks[i].dataCount;
        }
        if (buffer.getLengthInBits() <= totalDataCount * 8) {
          _this.typeNumber = typeNumber;
          break;
        }
      }
    }
    _this.typeNumber = _this.typeNumber || 4;
    _moduleCount = _this.typeNumber * 4 + 17;
    _modules = new Array(_moduleCount);
    for (let row = 0; row < _moduleCount; row++) {
      _modules[row] = new Array(_moduleCount);
      for (let col = 0; col < _moduleCount; col++) {
        _modules[row][col] = null;
      }
    }
    setupPositionProbePattern(0, 0);
    setupPositionProbePattern(_moduleCount - 7, 0);
    setupPositionProbePattern(0, _moduleCount - 7);
    setupTimingPattern();
    setupPositionAdjustPattern();
    _dataCache = createData(_this.typeNumber, _errorCorrectionLevel, _dataList);
    mapData(_dataCache);
  };

  function setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || _moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || _moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          _modules[row + r][col + c] = true;
        } else {
          _modules[row + r][col + c] = false;
        }
      }
    }
  }

  function setupTimingPattern() {
    for (let i = 8; i < _moduleCount - 8; i++) {
      if (_modules[i][6] !== null) continue;
      _modules[i][6] = i % 2 === 0;
      if (_modules[6][i] !== null) continue;
      _modules[6][i] = i % 2 === 0;
    }
  }

  function setupPositionAdjustPattern() {
    const pos = QRUtil.getPatternPosition(_this.typeNumber);
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (_modules[row][col] !== null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              _modules[row + r][col + c] = true;
            } else {
              _modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  function mapData(data) {
    let inc = -1;
    let row = _moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    for (let col = _moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (_modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            _modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || _moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  function createData(typeNumber, errorCorrectionLevel, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);
    const buffer = QRBitBuffer();
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(data.getMode(), 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
      data.write(buffer);
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }
    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error("code length overflow");
    }
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }
    while (buffer.getLengthInBits() % 8 !== 0) {
      buffer.putBit(false);
    }
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(PAD0, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(PAD1, 8);
    }
    return QRCodeModel.createBytes(buffer, rsBlocks);
  }

  return _this;
}

const QRErrorCorrectionLevel = { L: 1, M: 0, Q: 3, H: 2 };
const QRMode = { MODE_8BIT_BYTE: 2 };

function QR8bitByte(data) {
  const _this = {};
  _this.mode = QRMode.MODE_8BIT_BYTE;
  _this.data = data;
  _this.getLength = () => _this.data.length;
  _this.getMode = () => _this.mode;
  _this.write = (buffer) => {
    for (let i = 0; i < _this.data.length; i++) {
      buffer.put(_this.data.charCodeAt(i), 8);
    }
  };
  return _this;
}

function QRBitBuffer() {
  const _this = {};
  _this.buffer = [];
  _this.length = 0;
  _this.getLengthInBits = () => _this.length;
  _this.put = (num, length) => {
    for (let i = 0; i < length; i++) {
      _this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  };
  _this.putBit = (bit) => {
    const bufIndex = Math.floor(_this.length / 8);
    if (_this.buffer.length <= bufIndex) {
      _this.buffer.push(0);
    }
    if (bit) {
      _this.buffer[bufIndex] |= 0x80 >>> _this.length % 8;
    }
    _this.length++;
  };
  return _this;
}

const QRUtil = {
  getPatternPosition: (typeNumber) => {
    if (typeNumber === 1) return [];
    if (typeNumber === 2) return [6, 18];
    if (typeNumber === 3) return [6, 22];
    if (typeNumber === 4) return [6, 26];
    return [6, 30];
  },
  getLengthInBits: (mode, type) => {
    if (type >= 1 && type < 10) return 8;
    if (type < 27) return 16;
    return 16;
  }
};

const QRRSBlock = {
  getRSBlocks: (typeNumber, errorCorrectionLevel) => {
    const rsBlocks = {
      1: { L: [1, 26, 19], M: [1, 26, 16], Q: [1, 26, 13], H: [1, 26, 9] },
      2: { L: [1, 44, 34], M: [1, 44, 28], Q: [1, 44, 22], H: [1, 44, 16] },
      3: { L: [1, 70, 55], M: [1, 70, 44], Q: [2, 35, 17], H: [2, 35, 13] },
      4: { L: [1, 100, 80], M: [2, 50, 32], Q: [2, 50, 24], H: [4, 25, 9] }
    };
    const rs = rsBlocks[typeNumber][["L", "M", "Q", "H"][errorCorrectionLevel]];
    const list = [];
    list.push({ totalCount: rs[1], dataCount: rs[2] });
    return list;
  }
};

const QRCodeModel = {
  createBytes: (buffer, rsBlocks) => {
    let offset = 0;
    const maxDcCount = Math.max(...rsBlocks.map((r) => r.dataCount));
    const dcdata = rsBlocks.map((r) => {
      const dc = [];
      for (let i = 0; i < r.dataCount; i++) {
        dc.push(buffer.buffer[i + offset]);
      }
      offset += r.dataCount;
      return dc;
    });
    const totalCodeCount = rsBlocks.reduce((s, r) => s + r.totalCount, 0);
    const data = [];
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < dcdata.length; r++) {
        if (i < dcdata[r].length) data.push(dcdata[r][i]);
      }
    }
    while (data.length < totalCodeCount) data.push(0);
    return data;
  }
};
