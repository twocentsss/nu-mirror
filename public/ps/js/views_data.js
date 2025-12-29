
window.VIEWS_DATA = {
  phase0: `
    <div class="card">
      <h2>Phase 0: Meaning Hygiene & Decision Contract</h2>
      <div class="muted" style="margin-bottom:15px">
        "Meaning precedes analysis." Define your terms and type your claims before solving anything.
      </div>

      <div class="tabs">
        <button class="active" onclick="showPhase0(&#39;defs&#39;)">Operational Definitions</button>
        <button onclick="showPhase0(&#39;claims&#39;)">Claim Ledger</button>
      </div>

      <!-- Definitions Section -->
      <div id="p0-defs-wrap" style="margin-top:15px">
        <div class="strong small" style="margin-bottom:8px">LOCKED DEFINITIONS (What do words strictly mean?)</div>
        <div id="defList" style="display:flex; flex-direction:column; gap:8px"></div>
        <button class="btn secondary" id="btnAddDef" style="margin-top:10px">+ Add Definition</button>
      </div>

      <!-- Claims Section -->
      <div id="p0-claims-wrap" style="display:none; margin-top:15px">
        <div class="strong small" style="margin-bottom:8px">CLAIM LEDGER (Fact vs. Opinion)</div>
        <div class="muted small" style="margin-bottom:8px">Type every claim. Facts require proof. Opinions require owners.</div>
        <div id="claimList" style="display:flex; flex-direction:column; gap:8px"></div>
        <button class="btn secondary" id="btnAddClaim" style="margin-top:10px">+ Add Claim</button>
      </div>
    </div>
  `,
  "input": `
<div class="row">
  <div class="card">
    <div class="hd">
      <div><h3 class="title">Raw Context (language)</h3><div class="meta">Write naturally; parser extracts SCQA + constraints + stakeholders</div></div>
      <div class="meta">
        <button class="btn" id="btnLoadExample" title="Load a full sample project">Load Example</button>
      </div>
    </div>
    <div class="body">
      <div class="chips" style="margin-bottom:10px">
        <span class="pill action" onclick="insertText('ctxText', 'Conflict: The database is crashing during peak load.')">+ Crash</span>
        <span class="pill action" onclick="insertText('ctxText', 'Goal: We need to ship the MVP by Friday.')">+ Deadline</span>
        <span class="pill action" onclick="insertText('ctxText', 'Constraint: Budget is capped at $500.')">+ Budget</span>
        <span class="pill action" onclick="insertText('ctxText', 'Stakeholders: The CTO and the Marketing Lead.')">+ Stakeholders</span>
      </div>
      <textarea id="ctxText" placeholder="Start typing here... e.g. 'We have a problem with...'"></textarea>
      <div class="hr"></div>
      <div class="small">NLP Mode Active</div>
      <div class="muted">Paste brain dumps. The system will auto-segment Context, Conflict, and Constraints. <br/>You can still use <span class="pill">Context:</span> <span class="pill">Conflict:</span> if you want to force specific overriding.</div>
    </div>
  </div>

  <div class="card">
    <div class="hd">
      <div><h3 class="title">Raw Tasks (language)</h3><div class="meta">One line per task candidate</div></div>
      <div class="meta"><span class="pill">source</span> bullets</div>
    </div>
    <div class="body">
      <textarea id="tasksText" style="min-height:240px"></textarea>
      <div class="hr"></div>
      <div class="small">What happens on run</div>
      <ul class="muted" style="margin:8px 0 0 18px">
        <li>Parsed from bullets OR natural language (e.g., "We must fix the leak by Friday")</li>
        <li>Priorities & Due Dates inferred from text</li>
        <li>Narrative/report/story/comic derived from SCQA + tasks</li>
  <div class="card" style="display:none"> <!-- Hidden as now global -->
    <div class="hd">
      <div><h3 class="title">Live Structural Preview</h3><div class="meta">Auto-generated Issue Tree</div></div>
    </div>
    <div class="body">
       <!-- Removed local #treeWrap to use global one -->
    </div>
  </div>
</div>
`,
  "scqa": `
<div class="grid2">
  <div>
    <div class="small">Situation</div>
    <textarea id="scqaSituation"></textarea>
  </div>
  <div>
    <div class="small">Conflict</div>
    <textarea id="scqaConflict"></textarea>
  </div>
  <div>
    <div class="small">Question</div>
    <textarea id="scqaQuestion"></textarea>
  </div>
  <div>
    <div class="small">Answer</div>
    <textarea id="scqaAnswer"></textarea>
  </div>
</div>

<div class="hr"></div>

<div class="row">
  <div class="card">
    <div class="hd">
      <div><h3 class="title">Constraints</h3><div class="meta">Hard caps. If it’s not capped, it will expand.</div></div>
      <div class="meta"><span class="pill warn">guardrails</span></div>
    </div>
    <div class="body">
      <div class="grid2">
        <div><div class="small">Time</div><input id="cTime" type="text"/></div>
        <div><div class="small">Quality</div><input id="cQuality" type="text"/></div>
        <div><div class="small">Quantity</div><input id="cQuantity" type="text"/></div>
        <div><div class="small">Budget USD</div><input id="cBudget" type="number" min="0" step="10"/></div>
      </div>
      <div class="hr"></div>
      <div class="small">Stakeholders (comma-separated)</div>
      <input id="cStakeholders" type="text"/>
    </div>
  </div>

  <div class="card">
    <div class="hd">
      <div><h3 class="title">Hypotheses / Assertions</h3><div class="meta">Editable; used by outputs + tree notes</div></div>
      <div class="meta"><button class="btn" id="btnAddHyp">Add hypothesis</button></div>
    </div>
    <div class="body">
      <div class="small">Hypotheses</div>
      <div id="hypWrap"></div>
      <div class="hr"></div>
      <div class="small">Assertions</div>
      <div id="asrWrap"></div>
      <button class="btn" id="btnAddAsr" style="margin-top:10px">Add assertion</button>
    </div>
  </div>
</div>
`,
  "structure": `
<div style="display:flex; gap:10px; margin-bottom:14px;">
    <button class="btn primary" onclick="showSubTab('tree')">MECE Tree</button>
    <button class="btn" onclick="showSubTab('5ys')">5 Whys</button>
    <button class="btn" onclick="showSubTab('fishbone')">Fishbone</button>
</div>

<div id="tab-tree">
    <div class="card">
      <div class="hd">
        <div><h3 class="title">MECE Issue Tree</h3><div class="meta">Global Graph visible below</div></div>
        <div class="meta">
          <button class="btn" id="btnRegenTree">Rebuild starter tree</button>
        </div>
      </div>
      <div class="body">
         <div class="muted">Check the persistent graph panel at the bottom of the screen.</div>
      </div>
    </div>
</div>

<div id="tab-5ys" style="display:none">
    <div class="card">
      <div class="hd">
        <div><h3 class="title">5 Whys</h3><div class="meta">Edit any “why”; root cause and fix idea should be falsifiable</div></div>
        <div class="meta">
          <button class="btn" id="btnRegen5">Regenerate from SCQA</button>
        </div>
      </div>
      <div class="body">
         <div id="fiveWhysContainer"></div>
         <div class="hr"></div>
         <div class="grid2">
           <div>
             <div class="small">Root cause (claimed)</div>
             <textarea id="rootCause" style="min-height:120px"></textarea>
           </div>
           <div>
             <div class="small">Fix idea (testable)</div>
             <textarea id="fixIdea" style="min-height:120px"></textarea>
           </div>
         </div>
      </div>
    </div>
</div>

<div id="tab-fishbone" style="display:none">
    <div class="card">
        <div class="hd">
            <div><h3 class="title">Fishbone Diagram (Ishikawa)</h3><div class="meta">Root cause analysis by category</div></div>
        </div>
        <div class="body" id="fishboneWrap">
            <!-- Fishbone rendered here -->
            <div class="muted">Fishbone visualization placeholder</div>
        </div>
    </div>
</div>

<script>
function showSubTab(id){
    document.getElementById('tab-tree').style.display = id==='tree'?'block':'none';
    document.getElementById('tab-5ys').style.display = id==='5ys'?'block':'none';
    document.getElementById('tab-fishbone').style.display = id==='fishbone'?'block':'none';
}
</script>
`,
  "planning": `
    <div class="row">
      <div class="card">
        <div class="hd">
          <div><h3 class="title">Task List</h3><div class="meta">Click a row to edit; scoring recomputes deterministically</div></div>
          <div class="meta">
            <button class="btn" id="btnAddTask">Add task</button>
          </div>
        </div>
        <div class="body">
          <table class="table">
            <thead><tr><th>ID</th><th>Task</th><th>Score</th></tr></thead>
            <tbody><!-- populated by JS --></tbody>
          </table>
        </div>
      </div>

      <div class="card" id="taskEditorCard">
        <div class="hd">
          <div><h3 class="title">Task Editor</h3><div class="meta">Select a task first</div></div>
          <div class="meta">
            <button class="btn danger" id="btnDelTask">Delete</button>
          </div>
        </div>
        <div class="body" id="taskEditorBody">
          <div class="muted">Select a task on the left or click "Add task".</div>
        </div>
      </div>
    </div>
`,
  "prioritize": `
<div class="row">
  <div class="card">
    <div class="hd">
      <div><h3 class="title">MoSCoW</h3><div class="meta">Computed from TW/confidence/effort/urgency</div></div>
      <div class="meta"><button class="btn" id="btnRePrior">Recompute</button></div>
    </div>
    <div class="body muted" id="moscowWrap">
       <!-- populated by JS -->
    </div>
  </div>

  <div class="card">
    <div class="hd">
      <div><h3 class="title">Eisenhower</h3><div class="meta">Urgent: due ≤ 7 days. Important: P≤2 or TW≥7.</div></div>
      <div class="meta"><span class="pill accent">matrix</span></div>
    </div>
    <div class="body muted" id="eisenhowerWrap">
       <!-- populated by JS -->
    </div>
  </div>
</div>
`,
  "execute": `
<div class="card">
  <div class="hd">
    <div><h3 class="title">Task Execution Helper</h3><div class="meta">Force “next physical action” + constraints + timebox</div></div>
    <div class="meta"><span class="pill accent" id="execTaskId">—</span></div>
  </div>
  <div class="body">
    <div class="kpi">
      <div class="label">Selected Task</div>
      <div class="value" id="execTaskTitle">Select a task first</div>
      <div class="hint" id="execTaskMeta">—</div>
    </div>

    <div class="hr"></div>

    <div class="row">
      <div>
        <div class="small">Constraints in force</div>
        <div class="muted" style="margin-top:8px" id="execConstraints">
           <!-- Populated by JS -->
        </div>

        <div class="hr"></div>

        <div class="small">Execution plan</div>
        <div class="muted" style="margin-top:8px" id="execPlan">
           <!-- Populated by JS -->
        </div>
      </div>

      <div>
        <div class="small">Anti-drift checklist</div>
        <ul class="muted" style="margin:8px 0 0 18px">
          <li>Does this task change a decision this week? If no: defer.</li>
          <li>Is DoD objectively verifiable? If no: rewrite.</li>
          <li>Is evidence capture defined? If no: add link/notes slot.</li>
          <li>Does scoring reflect reality (CP≠1 when incomplete)?</li>
        </ul>

        <div class="hr"></div>

        <div class="small">One-line narrative (for logging)</div>
        <input id="execOneLiner" type="text"/>
        <button class="btn" id="btnLogExec" style="margin-top:10px">Log execution note</button>
      </div>
    </div>
  </div>
</div>
`,
  "score": `
<div class="card">
    <div class="hd">
        <div><h3 class="title">Scoring Dashboard</h3><div class="meta">Detailed metric breakdown</div></div>
    </div>
    <div class="body">
        <div class="kpis" id="scoreKpis">
            <!-- Populated by JS -->
        </div>
        <div class="hr"></div>
        <div class="muted">
            <b>Scoring Legend:</b><br/>
            TW = Time Weight (Impact)<br/>
            CP = Completion %<br/>
            SM = Strategic Multiplier<br/>
            ESF = External Support Factor<br/>
            SPS = Sustained Productivity Score (Result)
        </div>
    </div>
</div>
`,
  "narrative_build": `
<div class="card">
  <div class="hd"><div><h3 class="title">Narrative Builder</h3><div class="meta">Task-centric, operational</div></div><div class="meta"></div></div>
  <div class="body"><textarea id="outNarr" style="min-height:220px"></textarea></div>
</div>
<div style="margin-top:10px">
    <button class="btn" id="btnPullNarr">Pull from selected task</button>
    <button class="btn primary" id="btnSaveNarr">Save</button>
</div>
`,
  "narrative_make": `
<div class="card">
    <div class="hd">
        <div><h3 class="title">Make Narrative</h3><div class="meta">Refine the operational narrative into a cohesive story</div></div>
    </div>
    <div class="body">
        <textarea id="narrativeMake" style="min-height:300px"></textarea>
    </div>
</div>
`,
  "stories": `
<div class="card">
  <div class="hd"><div><h3 class="title">Story</h3><div class="meta">SCQA mapped to micro-plot</div></div><div class="meta"></div></div>
  <div class="body"><textarea id="outStory" style="min-height:220px"></textarea></div>
</div>
`,
  "comics": `
<div class="card">
  <div class="hd"><div><h3 class="title">Comic Beats</h3><div class="meta">Panel beats (dry, grounded)</div></div><div class="meta"></div></div>
  <div class="body"><textarea id="outComic" style="min-height:220px"></textarea></div>
</div>
`,
  "reports": `
<div class="card">
  <div class="hd"><div><h3 class="title">Report</h3><div class="meta">Audit-friendly snapshot</div></div><div class="meta"></div></div>
  <div class="body"><textarea id="outReport" style="min-height:220px"></textarea></div>
</div>
`,
  "brief": `
<div class="card">
    <div class="hd">
        <div><h3 class="title">Executive Brief</h3><div class="meta">One-pager for stakeholders</div></div>
    </div>
    <div class="body">
        <div class="grid2">
             <div class="kpi">
                 <div class="label">Top Goal</div>
                 <div class="value">Deliver V1</div>
             </div>
             <div class="kpi">
                 <div class="label">Primary Risk</div>
                 <div class="value warn">Scope Creep</div>
             </div>
        </div>
        <div class="hr"></div>
        <textarea style="min-height:180px">Brief summary goes here...</textarea>
    </div>
</div>
`,
  "meeting": `
<div class="card" style="min-height:500px; display:flex; align-items:center; justify-content:center; text-align:center;">
    <div>
        <h1>Executive Review</h1>
        <div class="hr" style="width:200px; margin:20px auto;"></div>
        <h2 class="title" style="font-size:24px;">Status: <span style="color:var(--good)">Green</span></h2>
        <p class="muted" style="margin-top:20px;">Use arrow keys to navigate slides (Coming Soon)</p>
    </div>
</div>
`
};
