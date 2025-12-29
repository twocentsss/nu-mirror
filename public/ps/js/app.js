
const ROUTES = [
  { id: "phase0", label: "0. Define" },
  { id: "input", file: "01_input.html", label: "Input" },
  { id: "scqa", file: "02_scqa.html", label: "SCQA" },
  { id: "structure", file: "03_structure.html", label: "Structure" },
  { id: "planning", file: "04_planning.html", label: "Planning" },
  { id: "prioritize", file: "05_prioritize.html", label: "Prioritize" },
  { id: "execute", file: "06_execution.html", label: "Executor" },
  { id: "score", file: "07_score.html", label: "Score" },
  { id: "narrative_build", file: "08_narrative_build.html", label: "Build Narrative" },
  { id: "narrative_make", file: "09_narrative_make.html", label: "Make Narrative" },
  { id: "stories", file: "10_stories.html", label: "Stories" },
  { id: "comics", file: "11_comics.html", label: "Comics" },
  { id: "reports", file: "12_reports.html", label: "Reports" },
  { id: "brief", file: "13_brief.html", label: "Brief" },
  { id: "meeting", file: "14_meeting.html", label: "Executive Meeting" }
];

let CURRENT_VIEW = "input";
let VIEW_CACHE = {};
const SUB_SECTIONS = [
  { id: "details", label: "Details", sectionId: "detailsSection" },
  { id: "graph", label: "Graph", sectionId: "graphSection" },
  { id: "case", label: "Case Report", sectionId: "caseSection" }
];
let CURRENT_SUBSECTION = "details";

const $ = (id) => document.getElementById(id);
const escapeHtml = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/* ============================================================
   ROUTER & APP
   ============================================================ */

async function loadView(routeId, transition = false) {
  const route = ROUTES.find(r => r.id === routeId);
  if (!route) return;

  CURRENT_VIEW = routeId;
  $("modeLabel").textContent = route.label;

  // Render Tabs (Highlighter)
  renderNav();

  // Load HTML
  const container = $("view-container");

  if (VIEW_CACHE[routeId]) {
    container.innerHTML = VIEW_CACHE[routeId];
  } else {
    // UPDATED: Load from global VIEWS_DATA to avoid CORS issues on local file://
    const html = (window.VIEWS_DATA && window.VIEWS_DATA[routeId]) || `<div class="card"><div class="body bad">View not found: ${routeId}</div></div>`;
    VIEW_CACHE[routeId] = html;
    container.innerHTML = html;
  }

  // Hydrate View (Bind Events)
  requestAnimationFrame(() => hydrateView(routeId));
}

function renderNav() {
  const nav = $("nav-steps");
  nav.innerHTML = ROUTES.map(r => `
    <button class="tab ${r.id === CURRENT_VIEW ? 'active' : ''}" 
      onclick="loadView('${r.id}')">
      ${r.label}
    </button>
  `).join("");
}

function renderSubTabs() {
  const nav = $("subtabs");
  if (!nav) return;
  nav.innerHTML = SUB_SECTIONS.map(s => `
    <button class="tab ${s.id === CURRENT_SUBSECTION ? 'active' : ''}"
      onclick="setSubSection('${s.id}')">
      ${s.label}
    </button>
  `).join("");
}

function setSubSection(id) {
  CURRENT_SUBSECTION = id;
  SUB_SECTIONS.forEach(s => {
    const el = $(s.sectionId);
    if (el) el.classList.toggle("hidden", s.id !== CURRENT_SUBSECTION);
  });
  renderSubTabs();
  if (id === "graph") {
    requestAnimationFrame(() => renderTree());
  }
  if (id === "case") {
    updateCaseReport();
  }
}
window.setSubSection = setSubSection;

function hydrateView(id) {
  console.log("Hydrating", id);
  // Common bindings
  if ($("btnRun")) $("btnRun").onclick = () => { runPipeline(); refreshView(); };

  // View specific bindings
  if (id === "phase0") hydratePhase0();
  if (id === "input") hydrateInput();
  if (id === "scqa") hydrateSCQA();
  if (id === "structure") hydrateStructure();
  if (id === "prioritize") hydratePrioritize();
  if (id === "planning") hydrateTasks();
  if (id === "execute") hydrateExecute();
  if (id === "score") hydrateScore();
  if (id.startsWith("narrative")) hydrateNarrative(id);
  if (id === "stories" || id === "comics" || id === "reports") hydrateOutputs(id);
  if (id === "brief") hydrateBrief();
  if (id === "meeting") hydrateMeeting();

  // Always refresh global graph
  renderTree();
  updateCaseReport();
}

function refreshView() {
  hydrateView(CURRENT_VIEW);
}

/* ============================================================
   VIEW LOGIC (Refactored from monolithic)
   ============================================================ */

function hydrateInput() {
  const ctx = $("ctxText");
  const tasks = $("tasksText");

  const autoRun = debounce(() => {
    runPipeline();
    log("Auto-ran pipeline (reactive)", "accent");
    renderTree(); // Refresh the live preview
  }, 1000);

  if (ctx) {
    ctx.value = MODEL.rawInput.contextText;
    ctx.oninput = (e) => {
      MODEL.rawInput.contextText = e.target.value;
      markDirty("context");
      autoRun();
    };
  }
  if (tasks) {
    tasks.value = MODEL.rawInput.tasksText;
    tasks.oninput = (e) => {
      MODEL.rawInput.tasksText = e.target.value;
      markDirty("tasks");
      autoRun();
    };
  }

  // Initial render of the live preview tree
  renderTree();

  if ($("btnLoadExample")) $("btnLoadExample").onclick = () => {
    // Reset to sample
    MODEL = deepClone(SAMPLE);
    // Update inputs
    if (ctx) ctx.value = MODEL.rawInput.contextText;
    if (tasks) tasks.value = MODEL.rawInput.tasksText;
    // Run pipeline
    runPipeline();
    log("Loaded example project.", "good");
    // Force refresh of current view (Input) just in case, but really we want to maybe show Structure?
    // Let's stay on Input so they can see the text, but maybe flash a message "Graphs Generated"
  };
}

// Global helper for chips
window.insertText = function (id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = (el.value ? el.value + "\n" : "") + text;
  // Trigger input event manually to update model
  el.dispatchEvent(new Event('input'));
  el.focus();
};

function hydrateSCQA() {
  const s = MODEL.scqa || {};
  const autoGen = debounce(() => {
    runGeneration();
    log("Auto-generated visuals (from manual SCQA)", "accent");
  }, 1000);

  // Bind textareas
  if ($("scqaSituation")) { $("scqaSituation").value = s.situation; $("scqaSituation").oninput = (e) => { MODEL.scqa.situation = e.target.value; markDirty("SCQA"); autoGen(); }; }
  if ($("scqaConflict")) { $("scqaConflict").value = s.conflict; $("scqaConflict").oninput = (e) => { MODEL.scqa.conflict = e.target.value; markDirty("SCQA"); autoGen(); }; }
  if ($("scqaQuestion")) { $("scqaQuestion").value = s.question; $("scqaQuestion").oninput = (e) => { MODEL.scqa.question = e.target.value; markDirty("SCQA"); autoGen(); }; }
  if ($("scqaAnswer")) { $("scqaAnswer").value = s.answer; $("scqaAnswer").oninput = (e) => { MODEL.scqa.answer = e.target.value; markDirty("SCQA"); autoGen(); }; }

  // Bind constraints
  if ($("cTime")) { $("cTime").value = s.constraints?.time || ""; $("cTime").oninput = (e) => { MODEL.scqa.constraints.time = e.target.value; autoGen(); }; }
  if ($("cQuality")) { $("cQuality").value = s.constraints?.quality || ""; $("cQuality").oninput = (e) => { MODEL.scqa.constraints.quality = e.target.value; autoGen(); }; }
  if ($("cQuantity")) { $("cQuantity").value = s.constraints?.quantity || ""; $("cQuantity").oninput = (e) => { MODEL.scqa.constraints.quantity = e.target.value; autoGen(); }; }
  if ($("cBudget")) { $("cBudget").value = s.constraints?.budgetUSD || 200; $("cBudget").oninput = (e) => { MODEL.scqa.constraints.budgetUSD = +e.target.value; autoGen(); }; }
  if ($("cStakeholders")) { $("cStakeholders").value = (s.constraints?.stakeholders || []).join(", "); $("cStakeholders").oninput = (e) => { MODEL.scqa.constraints.stakeholders = splitList(e.target.value); autoGen(); }; }

  renderHypAsr();
  if ($("btnAddHyp")) $("btnAddHyp").onclick = () => { MODEL.scqa.hypotheses.push({ id: uid("H"), h: "New hypothesis", confidence: 0.5 }); renderHypAsr(); };
  if ($("btnAddAsr")) $("btnAddAsr").onclick = () => { MODEL.scqa.assertions.push("New assertion"); renderHypAsr(); };
}

function renderHypAsr() {
  const hWrap = $("hypWrap");
  const aWrap = $("asrWrap");
  if (!hWrap || !aWrap) return;

  hWrap.innerHTML = (MODEL.scqa.hypotheses || []).map((h, i) => `
    <div class="node">
      <div class="nodeTop">
        <div class="left">
          <span class="pill accent">H${i + 1}</span>
          <input data-h="${escapeHtml(h.id)}" class="hypText" type="text" value="${escapeHtml(h.h)}"/>
        </div>
        <div class="right"><button class="btn danger hypDel" data-delh="${escapeHtml(h.id)}">X</button></div>
      </div>
    </div>`).join("") || `<div class="muted">No hypotheses.</div>`;

  aWrap.innerHTML = (MODEL.scqa.assertions || []).map((a, i) => `
    <div class="node">
      <div class="nodeTop">
        <div class="left">
          <span class="pill">A${i + 1}</span>
          <input data-a="${i}" class="asrText" type="text" value="${escapeHtml(a)}"/>
        </div>
        <div class="right"><button class="btn danger asrDel" data-dela="${i}">X</button></div>
      </div>
    </div>`).join("") || `<div class="muted">No assertions.</div>`;

  // Bindings
  document.querySelectorAll(".hypText").forEach(el => el.oninput = (e) => {
    const h = MODEL.scqa.hypotheses.find(x => x.id === el.dataset.h);
    if (h) h.h = e.target.value;
  });
  document.querySelectorAll(".hypDel").forEach(el => el.onclick = () => {
    MODEL.scqa.hypotheses = MODEL.scqa.hypotheses.filter(x => x.id !== el.dataset.delh);
    renderHypAsr();
  });
  document.querySelectorAll(".asrText").forEach(el => el.oninput = (e) => {
    MODEL.scqa.assertions[+el.dataset.a] = e.target.value;
  });
  document.querySelectorAll(".asrDel").forEach(el => el.onclick = () => {
    MODEL.scqa.assertions.splice(+el.dataset.dela, 1);
    renderHypAsr();
  });
}

function hydrateStructure() {
  renderTree();
  renderFiveWhys();
  renderFishbone();

  // Tab Switching Logic (Manual binding because inline scripts in innerHTML are flakey)
  const tabs = {
    tree: $("tab-tree"),
    "5ys": $("tab-5ys"),
    fishbone: $("tab-fishbone")
  };

  // Find buttons by their text or just assume order/class. 
  // Better: look for class or specific ID if added. 
  // Since specific IDs aren't on buttons, let's add IDs to views_data.js first? 
  // No, let's just querySelector them in order or by text.

  const buttons = document.querySelectorAll("#view-container button");
  buttons.forEach(b => {
    if (b.textContent === "MECE Tree") b.onclick = () => showTab('tree');
    if (b.textContent === "5 Whys") b.onclick = () => showTab('5ys');
    if (b.textContent === "Fishbone") b.onclick = () => showTab('fishbone');
  });

  function showTab(key) {
    Object.keys(tabs).forEach(k => {
      if (tabs[k]) tabs[k].style.display = k === key ? "block" : "none";
    });
  }

  if ($("btnRegenTree")) $("btnRegenTree").onclick = () => {
    MODEL.meceTree = buildIssueTree(MODEL.scqa, MODEL.fiveWhys, MODEL.tasks);
    renderTree();
  };
  if ($("btnRegen5")) $("btnRegen5").onclick = () => {
    const fw = buildFiveWhysFromSCQA(MODEL.scqa);
    MODEL.fiveWhys = fw;
    renderFiveWhys();
  };
}

function renderFiveWhys() {
  const fw = MODEL.fiveWhys || {};
  const chain = fw.chain || ["", "", "", "", ""];
  const container = $("fiveWhysContainer");
  const updateTree = debounce(() => {
    // Regenerate tree to reflect 5Ys changes
    MODEL.meceTree = buildIssueTree(MODEL.scqa, MODEL.fiveWhys, MODEL.tasks);
    renderTree();

    // Also run full pipeline if we want auto-tasks to update?
    // User asked for auto-task creation. That happens in runGeneration.
    // So let's actally call runPipeline() debounced.
    runPipeline();
    // runPipeline leads to runGeneration -> buildIssueTree -> renderTree (if we add it? No runPipeline doesn't render)
    // So:
    renderTree();
    // But runPipeline might be too heavy? No, it's fine.
    // Actually runGeneration calls buildIssueTree. So we just need runPipeline + renderTree.
  }, 500);

  if (container) {
    container.innerHTML = chain.map((x, i) => `
          <div style="margin-top:${i ? 10 : 0}px">
            <div class="small">Why #${i + 1}</div>
            <input class="whyInput" data-idx="${i}" type="text" value="${escapeHtml(x)}"/>
          </div>
        `).join("");

    document.querySelectorAll(".whyInput").forEach(el => el.oninput = (e) => {
      MODEL.fiveWhys.chain[+el.dataset.idx] = e.target.value;
      updateTree();
    });
  }
  if ($("rootCause")) {
    $("rootCause").value = fw.rootCause || "";
    $("rootCause").oninput = (e) => { MODEL.fiveWhys.rootCause = e.target.value; updateTree(); };
  }
  if ($("fixIdea")) {
    $("fixIdea").value = fw.fixIdea || "";
    $("fixIdea").oninput = (e) => { MODEL.fiveWhys.fixIdea = e.target.value; updateTree(); };
  }
}

function renderFishbone() {
  const fb = MODEL.fishbone || { categories: [] };
  const container = $("fishboneWrap");
  if (!container) return;

  container.innerHTML = fb.categories.map((cat, i) => `
    <div class="card" style="margin-bottom:10px; padding:10px;">
      <div class="strong">${escapeHtml(cat.name)}</div>
      <div id="fb-cat-${i}" style="margin-top:5px; display:flex; flex-direction:column; gap:5px;">
        ${cat.causes.map((c, j) => `
          <div style="display:flex; gap:5px;">
            <input class="fbInput" data-c="${i}.${j}" type="text" value="${escapeHtml(c)}" style="flex:1"/>
            <button class="btn danger fbDel" data-del="${i}.${j}">X</button>
          </div>
        `).join("")}
        <button class="btn small fbAdd" data-add="${i}">+ Cause</button>
      </div>
    </div>
  `).join("");

  // Bindings
  document.querySelectorAll(".fbInput").forEach(el => el.oninput = (e) => {
    const [cIdx, causeIdx] = el.dataset.c.split(".").map(Number);
    MODEL.fishbone.categories[cIdx].causes[causeIdx] = e.target.value;
  });
  document.querySelectorAll(".fbDel").forEach(el => el.onclick = () => {
    const [cIdx, causeIdx] = el.dataset.del.split(".").map(Number);
    MODEL.fishbone.categories[cIdx].causes.splice(causeIdx, 1);
    renderFishbone();
  });
  document.querySelectorAll(".fbAdd").forEach(el => el.onclick = () => {
    MODEL.fishbone.categories[+el.dataset.add].causes.push("New Cause");
    renderFishbone();
  });
}

function hydratePrioritize() {
  const mWrap = $("moscowWrap");
  const eWrap = $("eisenhowerWrap");
  if (!mWrap || !eWrap) return;

  if ($("btnRePrior")) $("btnRePrior").onclick = () => {
    MODEL.priorities = prioritizeTasks(MODEL.tasks);
    hydratePrioritize();
  };

  const p = MODEL.priorities || { moscow: { must: [], should: [], could: [], wont: [] }, eisenhower: { ui: [], un: [], ni: [], nn: [] } };

  mWrap.innerHTML = `
      <div><span class="pill good">Must</span> ${escapeHtml(p.moscow.must.join(" • ") || "—")}</div>
      <div style="margin-top:10px"><span class="pill warn">Should</span> ${escapeHtml(p.moscow.should.join(" • ") || "—")}</div>
      <div style="margin-top:10px"><span class="pill">Could</span> ${escapeHtml(p.moscow.could.join(" • ") || "—")}</div>
      <div style="margin-top:10px"><span class="pill bad">Won’t</span> ${escapeHtml(p.moscow.wont.join(" • ") || "—")}</div>
    `;

  eWrap.innerHTML = `
      <div><span class="pill good">Urgent+Important</span> ${escapeHtml(p.eisenhower.ui.join(" • ") || "—")}</div>
      <div style="margin-top:10px"><span class="pill warn">Urgent+Not</span> ${escapeHtml(p.eisenhower.un.join(" • ") || "—")}</div>
      <div style="margin-top:10px"><span class="pill">Not Urgent+Important</span> ${escapeHtml(p.eisenhower.ni.join(" • ") || "—")}</div>
      <div style="margin-top:10px"><span class="pill bad">Not Urgent+Not</span> ${escapeHtml(p.eisenhower.nn.join(" • ") || "—")}</div>
    `;
}

// Helpers
function markDirty(field) {
  if ($("updatedLabel")) $("updatedLabel").textContent = "Unsaved";
  console.log("Change:", field);
}

function splitList(s) { return String(s || "").split(/[,;]/).map(x => x.trim()).filter(Boolean); }
function treeToFlat(node, depth = 0, acc = []) {
  acc.push({ node, depth });
  (node.children || []).forEach(c => treeToFlat(c, depth + 1, acc));
  return acc;
}
function findNodeById(node, id) {
  if (node.id === id) return node;
  for (let c of (node.children || [])) {
    const found = findNodeById(c, id);
    if (found) return found;
  }
  return null;
}
function addChild(root, pid, label, kind) {
  const parent = findNodeById(root, pid);
  if (parent) {
    if (!parent.children) parent.children = [];
    parent.children.push({ id: uid("N"), label, kind, children: [] });
  }
}
function removeNode(root, id) {
  // simplistic removal from root's children, recursive
  if (!root.children) return;
  root.children = root.children.filter(x => x.id !== id);
  root.children.forEach(c => removeNode(c, id));
}

// Helper to update the global graph after model changes
// (Does not re-parse raw inputs, just accepts current MODEL state)
const refreshGlobalGraph = debounce(() => {
  MODEL.meceTree = buildIssueTree(MODEL.scqa, MODEL.fiveWhys, MODEL.tasks);
  renderTree();
}, 300);

function renderFishbone() {
  const fb = MODEL.fishbone || { categories: [] };
  const container = $("fishboneWrap");
  if (!container) return;

  container.innerHTML = fb.categories.map((cat, i) => `
    <div class="card" style="margin-bottom:10px; padding:10px;">
      <div class="strong">${escapeHtml(cat.name)}</div>
      <div id="fb-cat-${i}" style="margin-top:5px; display:flex; flex-direction:column; gap:5px;">
        ${cat.causes.map((c, j) => `
          <div style="display:flex; gap:5px;">
            <input class="fbInput" data-c="${i}.${j}" type="text" value="${escapeHtml(c)}" style="flex:1"/>
            <button class="btn danger fbDel" data-del="${i}.${j}">X</button>
          </div>
        `).join("")}
        <button class="btn small fbAdd" data-add="${i}">+ Cause</button>
      </div>
    </div>
  `).join("");

  // Bindings
  document.querySelectorAll(".fbInput").forEach(el => el.oninput = (e) => {
    const [cIdx, causeIdx] = el.dataset.c.split(".").map(Number);
    MODEL.fishbone.categories[cIdx].causes[causeIdx] = e.target.value;
    refreshGlobalGraph();
  });
  document.querySelectorAll(".fbDel").forEach(el => el.onclick = () => {
    const [cIdx, causeIdx] = el.dataset.del.split(".").map(Number);
    MODEL.fishbone.categories[cIdx].causes.splice(causeIdx, 1);
    renderFishbone();
    refreshGlobalGraph();
  });
  document.querySelectorAll(".fbAdd").forEach(el => el.onclick = () => {
    MODEL.fishbone.categories[+el.dataset.add].causes.push("New Cause");
    renderFishbone();
    refreshGlobalGraph();
  });
}

// Helper to get analysis leaves for linking
function getAnalysisLeaves() {
  const leaves = [];

  // 5 Whys Root
  if (MODEL.fiveWhys.rootCause && MODEL.fiveWhys.rootCause !== "Root cause placeholder") {
    leaves.push({ id: "5Y-ROOT", label: MODEL.fiveWhys.rootCause, source: "5 Whys" });
  }
  // 5 Whys Chain (Last valid item?)
  // Actually, usually you link to the Root Cause.

  // Fishbone
  if (MODEL.fishbone && MODEL.fishbone.categories) {
    MODEL.fishbone.categories.forEach((cat, i) => {
      cat.causes.forEach((c, j) => {
        leaves.push({ id: `FB-${i}-${j}`, label: c, source: `Fishbone: ${cat.name}` });
      });
    });
  }

  // Hypotheses
  if (MODEL.scqa.hypotheses) {
    MODEL.scqa.hypotheses.forEach(h => {
      leaves.push({ id: h.id, label: h.h, source: "Hypothesis" });
    });
  }

  return leaves;
}

function hydrateTasks() {
  // Render list
  const tbody = document.querySelector("tbody");
  if (tbody) {
    tbody.innerHTML = (MODEL.tasks || []).map(t => {
      const tone = t.status === "Done" ? "good" : t.status === "In Progress" ? "warn" : "bad";
      return `
           <tr data-task="${escapeHtml(t.id)}" class="taskRow" style="cursor:pointer">
             <td style="width:78px;color:rgba(168,179,195,.95)">${escapeHtml(t.id)}</td>
             <td>
               <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                 <span class="pill ${tone}">${escapeHtml(t.status)}</span>
                 <b>${escapeHtml(t.title)}</b>
                 ${(t.tags || []).slice(0, 4).map(x => `<span class="pill">${escapeHtml(x)}</span>`).join("")}
               </div>
               <div class="small" style="margin-top:6px">
                 P${escapeHtml(String(t.priority ?? "?"))} • due ${escapeHtml(t.due || "—")} • eff ${escapeHtml(String(t.estimateMin || 0))}m • conf ${escapeHtml(String(Math.round((t.confidence || 0.6) * 100)))}%
               </div>
             </td>
             <td style="width:220px">
               <div class="small">TW/CP → SPS</div>
               <div class="muted">
                 TW ${escapeHtml(String(t.score?.TW ?? 0))} • CP ${escapeHtml(String(t.score?.CP ?? 0))}<br/>
                 SPS <b>${escapeHtml(String(t.score?.SPS ?? 0))}</b>
               </div>
             </td>
           </tr>`;
    }).join("") || `<tr><td colspan="3" class="muted">No tasks.</td></tr>`;

    document.querySelectorAll(".taskRow").forEach(row => {
      row.onclick = () => {
        SELECTED_TASK_ID = row.dataset.task;
        log(`Selected task ${SELECTED_TASK_ID}`);
        hydrateTasks(); // re-render to update editor
      };
    });
  }

  // Editor
  const selected = (MODEL.tasks || []).find(x => x.id === SELECTED_TASK_ID) || MODEL.tasks[0];
  const editorBody = $("taskEditorBody");

  if (editorBody) {
    if (selected) {
      editorBody.innerHTML = taskEditorHTML(selected);

      // Wire editor events
      if ($("tTitle")) $("tTitle").oninput = (e) => { selected.title = e.target.value; markDirty("task title"); refreshGlobalGraph(); };
      if ($("tStatus")) $("tStatus").onchange = (e) => { selected.status = e.target.value; markDirty("task status"); refreshGlobalGraph(); };
      if ($("tPri")) $("tPri").oninput = (e) => { selected.priority = +e.target.value || 3; markDirty("task priority"); refreshGlobalGraph(); };
      if ($("tDue")) $("tDue").oninput = (e) => { selected.due = e.target.value.trim(); markDirty("task due"); };
      if ($("tEff")) $("tEff").oninput = (e) => { selected.estimateMin = +e.target.value || 0; markDirty("task effort"); };
      if ($("tConf")) $("tConf").oninput = (e) => { selected.confidence = clamp(+e.target.value || 0, 0, 1); markDirty("task confidence"); };
      if ($("tTags")) $("tTags").oninput = (e) => { selected.tags = splitList(e.target.value); markDirty("task tags"); };
      if ($("tOwner")) $("tOwner").oninput = (e) => { selected.owner = e.target.value; markDirty("task owner"); };

      if ($("tLink")) $("tLink").onchange = (e) => { selected.linkedNodeId = e.target.value; markDirty("linked analysis"); refreshGlobalGraph(); };

      if ($("tNext")) $("tNext").oninput = (e) => { selected.nextAction = e.target.value; markDirty("next action"); };
      if ($("tDoD")) $("tDoD").oninput = (e) => { selected.doneDefinition = e.target.value; markDirty("DoD"); };
      if ($("tBlock")) $("tBlock").oninput = (e) => { selected.blockers = splitList(e.target.value); markDirty("blockers"); };

      if ($("sTW")) $("sTW").oninput = (e) => { selected.score.TW = clamp(+e.target.value || 0, 0, 10); markDirty("TW"); };
      if ($("sCP")) $("sCP").oninput = (e) => { selected.score.CP = clamp(+e.target.value || 0, 0, 1); markDirty("CP"); };
      if ($("sSM")) $("sSM").oninput = (e) => { selected.score.SM = +e.target.value || 1; markDirty("SM"); };
      if ($("sESF")) $("sESF").oninput = (e) => { selected.score.ESF = +e.target.value || 1; markDirty("ESF"); };
      if ($("sQM")) $("sQM").oninput = (e) => { selected.score.QM = +e.target.value || 1; markDirty("QM"); };
      if ($("sSF")) $("sSF").oninput = (e) => { selected.score.SF = +e.target.value || 1; markDirty("SF"); };
      if ($("sBP")) $("sBP").oninput = (e) => { selected.score.BP = +e.target.value || 0; markDirty("BP"); };

      if ($("btnComputeScore")) $("btnComputeScore").onclick = () => {
        computeTaskScore(selected);
        log(`Recomputed score for ${selected.id}`);
        hydrateTasks();
        syncJSONBox();
      };
      if ($("btnGenOutputs")) $("btnGenOutputs").onclick = () => {
        computeTaskScore(selected);
        selected.narrative = genTaskNarrative(selected, MODEL.scqa);
        selected.report = genTaskReport(selected);
        selected.story = genTaskStory(selected, MODEL.scqa);
        selected.comic = genTaskComic(selected);
        // Also set global outputs
        MODEL.outputs.narrative = selected.narrative;
        MODEL.outputs.report = selected.report;
        MODEL.outputs.story = selected.story;
        MODEL.outputs.comic = selected.comic;
        log(`Generated outputs for ${selected.id}`);
        hydrateTasks();
        syncJSONBox();
      };
      if ($("btnSelectForExec")) $("btnSelectForExec").onclick = () => {
        SELECTED_TASK_ID = selected.id;
        loadView("execute");
        log(`Selected ${selected.id} for execution`);
      };
      if ($("btnDelTask")) $("btnDelTask").onclick = () => {
        MODEL.tasks = MODEL.tasks.filter(x => x.id !== selected.id);
        SELECTED_TASK_ID = MODEL.tasks[0]?.id || null;
        log("Deleted task");
        hydrateTasks();
        syncJSONBox();
        refreshGlobalGraph();
      };
    } else {
      editorBody.innerHTML = `<div class="muted">Select a task on the left or click "Add task".</div>`;
      if ($("btnDelTask")) $("btnDelTask").disabled = true;
    }
  }

  if ($("btnAddTask")) $("btnAddTask").onclick = () => {
    const id = uid("T");
    MODEL.tasks.unshift({
      id, title: "New task",
      status: "Not Started", priority: 3, due: "", estimateMin: 60, impact: 0.6, confidence: 0.6,
      owner: "You", blockers: [], nextAction: "", doneDefinition: "",
      narrative: "", report: "", story: "", comic: "",
      score: { TW: 6, CP: 0, SM: 1, ESF: 1, QM: 1, SF: 1, BP: 0, BPS: 0, APS: 0, SPS: 0 },
      tags: []
    });
    SELECTED_TASK_ID = id;
    log(`Added task ${id}`);
    hydrateTasks();
    syncJSONBox();
    refreshGlobalGraph();
  };
}

function taskEditorHTML(t) {
  const s = t.score || {};
  return `
    <div class="grid2">
      <div><div class="small">Title</div><input id="tTitle" type="text" value="${escapeHtml(t.title)}"/></div>
      <div>
        <div class="small">Status</div>
        <select id="tStatus">
          ${["Not Started", "In Progress", "Done", "Closed", "Archived"].map(x => `<option ${t.status === x ? "selected" : ""}>${x}</option>`).join("")}
        </select>
      </div>

      <div><div class="small">Priority (1=highest)</div><input id="tPri" type="number" min="1" max="9" step="1" value="${escapeHtml(String(t.priority ?? 3))}"/></div>
      <div><div class="small">Due (YYYY-MM-DD)</div><input id="tDue" type="text" value="${escapeHtml(t.due || "")}"/></div>

      <div><div class="small">Effort (minutes)</div><input id="tEff" type="number" min="0" step="5" value="${escapeHtml(String(t.estimateMin || 0))}"/></div>
      <div><div class="small">Confidence (0..1)</div><input id="tConf" type="number" min="0" max="1" step="0.05" value="${escapeHtml(String(t.confidence ?? 0.6))}"/></div>

      <div><div class="small">Tags (comma-separated)</div><input id="tTags" type="text" value="${escapeHtml((t.tags || []).join(", "))}"/></div>
      <div><div class="small">Owner</div><input id="tOwner" type="text" value="${escapeHtml(t.owner || "You")}"/></div>
    </div>

    <div class="hr"></div>

      <div>
        <div class="small">Next action (single physical action)</div>
        <input id="tNext" type="text" value="${escapeHtml(t.nextAction || "")}"/>
      </div>
      <div>
        <div class="small">Definition of done (objective)</div>
        <input id="tDoD" type="text" value="${escapeHtml(t.doneDefinition || "")}"/>
      </div>
    </div>
    
    <div class="hr"></div>
    
    <div>
        <div class="small">Linked Analysis Leaf (Context)</div>
        <select id="tLink" style="width:100%">
            <option value="">(None)</option>
            ${getAnalysisLeaves().map(l => `<option value="${escapeHtml(l.id)}" ${t.linkedNodeId === l.id ? "selected" : ""}>[${escapeHtml(l.source)}] ${escapeHtml(l.label)}</option>`).join("")}
        </select>
    </div>

    <div class="hr"></div>

    <div class="small">Blockers (comma-separated)</div>
    <input id="tBlock" type="text" value="${escapeHtml((t.blockers || []).join(", "))}"/>

    <div class="hr"></div>

    <div class="small">Scoring (per task)</div>
    <div class="grid2" style="margin-top:8px">
      <div><div class="small">TW (0..10)</div><input id="sTW" type="number" min="0" max="10" step="1" value="${escapeHtml(String(s.TW ?? 0))}"/></div>
      <div><div class="small">CP (0..1)</div><input id="sCP" type="number" min="0" max="1" step="0.05" value="${escapeHtml(String(s.CP ?? 0))}"/></div>

      <div><div class="small">SM (1..1.5)</div><input id="sSM" type="number" min="0.5" max="2" step="0.05" value="${escapeHtml(String(s.SM ?? 1))}"/></div>
      <div><div class="small">ESF (0.8..1.2)</div><input id="sESF" type="number" min="0.5" max="2" step="0.05" value="${escapeHtml(String(s.ESF ?? 1))}"/></div>

      <div><div class="small">QM (0.5..1.5)</div><input id="sQM" type="number" min="0.2" max="2" step="0.05" value="${escapeHtml(String(s.QM ?? 1))}"/></div>
      <div><div class="small">SF (1..1.5)</div><input id="sSF" type="number" min="0.5" max="3" step="0.05" value="${escapeHtml(String(s.SF ?? 1))}"/></div>

      <div><div class="small">BP (0..0.8)</div><input id="sBP" type="number" min="0" max="0.8" step="0.05" value="${escapeHtml(String(s.BP ?? 0))}"/></div>
      <div>
        <div class="small">Computed</div>
        <div class="muted">
          BPS <b>${escapeHtml(String(s.BPS ?? 0))}</b> • APS <b>${escapeHtml(String(s.APS ?? 0))}</b> • SPS <b>${escapeHtml(String(s.SPS ?? 0))}</b>
        </div>
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
      <button class="btn" id="btnComputeScore">Recompute score</button>
      <button class="btn" id="btnGenOutputs">Generate outputs</button>
      <button class="btn primary" id="btnSelectForExec">Select for Execute</button>
    </div>
  `;
}

function hydrateExecute() {
  const t = (MODEL.tasks || []).find(x => x.id === SELECTED_TASK_ID) || MODEL.tasks[0];
  if (!t) return;

  if ($("execTaskId")) $("execTaskId").textContent = t.id;
  if ($("execTaskTitle")) $("execTaskTitle").textContent = t.title;
  if ($("execTaskMeta")) $("execTaskMeta").textContent = `Status ${t.status} • P${t.priority} • Eff ${t.estimateMin}m`;

  if ($("execConstraints")) {
    const scqa = MODEL.scqa?.constraints || {};
    $("execConstraints").innerHTML = `
           <span class="pill">Time</span> ${escapeHtml(scqa.time || "—")}<br/>
           <span class="pill">Quality</span> ${escapeHtml(scqa.quality || "—")}<br/>
           <span class="pill">Quantity</span> ${escapeHtml(scqa.quantity || "—")}<br/>
           <span class="pill">Budget</span> $${escapeHtml(String(scqa.budgetUSD ?? 0))}
         `;
  }

  if ($("execPlan")) {
    $("execPlan").innerHTML = `
           <div><span class="pill good">Next action</span> ${escapeHtml(t.nextAction || "Define next action.")}</div>
           <div style="margin-top:8px"><span class="pill warn">Timebox</span> ${escapeHtml(String(guessEffort(t.title) * 0.5))} minutes</div>
           <div style="margin-top:8px"><span class="pill bad">Blockers</span> ${escapeHtml((t.blockers || []).join("; ") || "none")}</div>
           <div style="margin-top:8px"><span class="pill accent">DoD</span> ${escapeHtml(t.doneDefinition || "Define objective acceptance criteria.")}</div>
         `;
  }

  if ($("btnLogExec")) $("btnLogExec").onclick = () => {
    const note = $("execOneLiner").value.trim();
    log(`EXEC: ${note || `Autolog for ${t.id}`}`, "info");
  };
}

function hydrateScore() {
  const kpis = $("scoreKpis");
  if (!kpis) return;

  // Aggregate SPS
  const totalSPS = (MODEL.tasks || []).reduce((aec, t) => aec + (t.score?.SPS || 0), 0);
  const avgSPS = totalSPS / (MODEL.tasks?.length || 1);

  kpis.innerHTML = `
        <div class="kpi"><div class="label">Avg SPS</div><div class="value">${Math.round(avgSPS * 10) / 10}</div></div>
        <div class="kpi"><div class="label">Total Tasks</div><div class="value">${MODEL.tasks.length}</div></div>
        <div class="kpi"><div class="label">Done</div><div class="value">${MODEL.tasks.filter(t => t.status === "Done").length}</div></div>
    `;
}

function hydrateNarrative(id) {
  // 08_narrative_build binding
  const t = (MODEL.tasks || []).find(x => x.id === SELECTED_TASK_ID) || MODEL.tasks[0];
  if ($("outNarr")) {
    $("outNarr").value = MODEL.outputs.narrative || "";
    $("outNarr").oninput = (e) => MODEL.outputs.narrative = e.target.value;
  }
  if ($("btnPullNarr") && t) $("btnPullNarr").onclick = () => {
    // regenerate narrative for this task
    const txt = `Task: ${t.title}\nNext: ${t.nextAction}\nBlockers: ${(t.blockers || []).join(",")}`;
    $("outNarr").value = txt;
    MODEL.outputs.narrative = txt;
  };
  if ($("btnSaveNarr")) $("btnSaveNarr").onclick = () => {
    log("Narrative saved.");
    syncJSONBox();
  };
}

function hydrateOutputs(id) {
  let field = "report";
  if (id === "stories") field = "story";
  if (id === "comics") field = "comic";

  const el = $(id === "reports" ? "outReport" : id === "stories" ? "outStory" : "outComic");
  if (el) {
    el.value = MODEL.outputs[field] || "";
    el.oninput = (e) => MODEL.outputs[field] = e.target.value;
  }
}


// Init
window.addEventListener("DOMContentLoaded", () => {
  renderNav();
  renderSubTabs();
  setSubSection("details");
  loadView("input");
  bindCaseReportActions();
  // Log init
});
function updateCaseReport() {
  const el = $("caseReportText");
  if (!el) return;
  if (!MODEL.outputs.caseReport && typeof genCaseReport === "function") {
    MODEL.outputs.caseReport = genCaseReport(MODEL.scqa, MODEL.fiveWhys, MODEL.fishbone, MODEL.priorities, MODEL.tasks, MODEL.meceTree);
  }
  el.value = MODEL.outputs.caseReport || "";
}

function bindCaseReportActions() {
  const btn = $("btnCopyCase");
  const el = $("caseReportText");
  if (!btn || !el) return;
  btn.onclick = async () => {
    const text = MODEL.outputs.caseReport || "";
    if (!text) return;
    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (err) {
        copied = false;
      }
    }
    if (!copied) {
      el.focus();
      el.select();
      try {
        copied = document.execCommand("copy");
      } catch (err) {
        copied = false;
      }
    }
    const original = btn.textContent;
    btn.textContent = copied ? "Copied" : "Copy failed";
    setTimeout(() => { btn.textContent = original; }, 1200);
  };
}
// Helper for tree rendering (Mermaid Visual)
function renderTree() {
  const wrap = $("treeWrap");
  if (!wrap) return;
  const mermaidLib = window.mermaid;
  if (!mermaidLib || !mermaidLib.run) {
    wrap.innerHTML = `<div class="muted">Mermaid is not available. Check script loading.</div>`;
    return;
  }

  if (!MODEL.meceTree || !MODEL.meceTree.root) {
    wrap.innerHTML = `<div class="muted">No tree structure generated.</div>`;
    return;
  }

  // 1. Generate Mermaid Syntax
  let edges = [];

  function traverse(node) {
    if (!node) return;
    // Clean ID and Label for Mermaid
    // Mermaid IDs must be alphanumeric. We use node.id (e.g. N-XYZ) but replace dashed.
    const safeId = node.id.replace(/-/g, "_");
    const safeLabel = (node.label || "Node").replace(/["()]/g, '');

    // Node Definition
    // Style root differently
    if (node.id === "N-ROOT" || node.kind === "root") {
      edges.push(`${safeId}(["${safeLabel}"])`);
      edges.push(`style ${safeId} fill:#6ea8ff,stroke:#333,stroke-width:3px,color:#000`);
    } else if (node.kind === "context") {
      edges.push(`${safeId}[/"${safeLabel}"/]`); // Parallelogram
      edges.push(`style ${safeId} fill:#1e2631,stroke:#a8b3c3,stroke-dasharray: 5 5`);
    } else if (node.kind === "hypothesis") {
      edges.push(`${safeId}{"${safeLabel}"}`); // Rhombus
      edges.push(`style ${safeId} fill:#3b2e5a,stroke:#b180ff`);
    } else if (node.kind === "solution") {
      edges.push(`${safeId}(("${safeLabel}"))`); // Circle
      edges.push(`style ${safeId} fill:#2d4a3e,stroke:#54d38a`);
    } else if (node.kind === "action" || node.kind === "task") {
      edges.push(`${safeId}["${safeLabel}"]`);
      edges.push(`style ${safeId} fill:#12161c,stroke:#1e2631`);
    } else {
      edges.push(`${safeId}["${safeLabel}"]`);
    }

    if (node.kind !== "root") edges.push(`click ${safeId} call editNode("${node.id}") "Edit"`);

    if (node.children && node.children.length) {
      node.children.forEach(c => {
        const safeChildId = c.id.replace(/-/g, "_");
        edges.push(`${safeId} --> ${safeChildId}`);
        traverse(c);
      });
    }
  }

  traverse(MODEL.meceTree.root);

  // Add Cross-Links (Analysis -> Tasks)
  if (MODEL.tasks) {
    MODEL.tasks.forEach(t => {
      if (t.linkedNodeId) {
        const safeTaskId = t.id.replace(/-/g, "_");
        const safeLinkId = t.linkedNodeId.replace(/-/g, "_");
        // Dashed link for "Derived From"
        edges.push(`${safeLinkId} -.-> ${safeTaskId}`);
      }
    });
  }

  const graphDefinition = "graph LR\n" + edges.join("\n");

  // 2. Render
  // Avoid re-rendering if identical to prevent flicker? 
  // For now, simple replace.
  wrap.innerHTML = `<pre class="mermaid">${graphDefinition}</pre>`;

  try {
    mermaidLib.run({ nodes: [wrap.querySelector('.mermaid')] });
  } catch (e) {
    console.error("Mermaid error:", e);
    wrap.innerHTML += `<div class="small bad">Graph error</div>`;
  }

  updateCaseReport();
}

// Global handler for clicking a node (mapped from mermaid click)
window.editNode = (id) => {
  // For now, just log. A real modal would be nice.
  // Or maybe we can't easily do click handling in global mermaid without exposing logic.
  // Let's prompt for rename as a cheap hack for interactivity
  const n = findNode(MODEL.meceTree.root, id);
  if (n) {
    const newLabel = prompt("Rename node:", n.label);
    if (newLabel) {
      n.label = newLabel;
      markDirty("tree");
      renderTree();
    }
  }
};

// Tree manipulation helpers (Expose to window for onclicks in HTML string)
window.updateNodeLabel = (id, val) => {
  const n = findNode(MODEL.meceTree.root, id);
  if (n) { n.label = val; markDirty("tree"); }
};
window.addNodeChild = (id) => {
  // Deprecated in visual mode unless we add controls back.
  // We strictly switched to visual only.
};
window.removeNode = (id) => {
  // Deprecated
};

function findNode(node, id) {
  if (node.id === id) return node;
  for (const c of (node.children || [])) {
    const found = findNode(c, id);
    if (found) return found;
  }
  return null;
}

function deleteNode(parent, id) {
  if (!parent.children) return;
  const idx = parent.children.findIndex(x => x.id === id);
  if (idx !== -1) {
    parent.children.splice(idx, 1);
    return;
  }
  parent.children.forEach(c => deleteNode(c, id));
}

function hydrateBrief() {
  const el = $("outBrief");
  if (el) {
    el.value = MODEL.outputs.brief || "";
    el.oninput = (e) => MODEL.outputs.brief = e.target.value;
  }
}

function hydrateMeeting() {
  const deck = MODEL.outputs.meeting || [];
  const container = $("meetingWrap");
  if (!container) return;

  if (deck.length === 0) {
    container.innerHTML = `<div class="muted">No meeting deck generated.</div>`;
    return;
  }

  container.innerHTML = deck.map(slide => `
    <div class="card" style="margin-bottom:20px; padding:20px;">
      <h2 style="margin-top:0">${escapeHtml(slide.title)}</h2>
      ${slide.subtitle ? `<div class="muted" style="margin-bottom:15px">${escapeHtml(slide.subtitle)}</div>` : ""}
      <ul style="padding-left:20px; line-height:1.6">
        ${(slide.points || []).map(p => `<li>${escapeHtml(p)}</li>`).join("")}
      </ul>
    </div>
  `).join("");
}
