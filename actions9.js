/* ── PWA SERVICE-WORKER REG ───────────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

/* ── STATE ────────────────────────────────────────────── */
let data  = JSON.parse(localStorage.getItem('likert_data') || '{"metrics":[],"records":[]}');
let chart = null;

/* ── CORE PERSISTENCE ─────────────────────────────────── */
function saveData() {
  localStorage.setItem('likert_data', JSON.stringify(data));
  renderAll();
}

/* ── NAVIGATION ───────────────────────────────────────── */
function switchTab(id) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el  => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById(id + 'Btn').classList.add('active');
}

/* ── METRIC CRUD ──────────────────────────────────────── */
function addMetric() {
  const input  = document.getElementById('newMetric');
  const metric = input.value.trim();

  if (metric.length === 0)       { alert('Metric name cannot be blank.'); return; }
  if (data.metrics.includes(metric)) { alert('Metric already exists.');    return; }

  data.metrics.push(metric);
  input.value = '';
  input.focus();
  saveData();
}

function deleteMetric(metric) {
  if (!confirm(`Delete metric "${metric}" and all its measurements?`)) return;
  data.metrics  = data.metrics.filter(m => m !== metric);
  data.records  = data.records.filter(r => r.metric !== metric);
  saveData();
}

/* ── MEASUREMENT CRUD ─────────────────────────────────── */
function recordMeasurement() {
  if (!data.metrics.length) { alert('Create a metric first.'); return; }

  const metric = document.getElementById('metricSelect').value;
  if (!metric) { alert('Select a metric.'); return; }

  const value = document.getElementById('sliderValue').value;
  const y  = document.getElementById('yearSelect').value;
  const m  = document.getElementById('monthSelect').value.padStart(2,'0');
  const d  = document.getElementById('daySelect').value.padStart(2,'0');
  const date = `${y}-${m}-${d}`;
  const timestamp = new Date().toISOString();

  data.records.push({ metric, value, date, timestamp });
  saveData();
}

function deleteRecord(index) {
  data.records.splice(index,1);
  saveData();
}

/* ── RENDER METRIC SELECTS & SUMMARY ──────────────────── */
function renderMetrics() {
  const ids = ['metricSelect', 'chartMetricSelect', 'logMetric'];
  const previousSelections = {};

  // store current selections
  ids.forEach(id => {
    const sel = document.getElementById(id);
    previousSelections[id] = sel.value;
  });

  // rebuild dropdowns
  ids.forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">Metric</option>';
    data.metrics.forEach(m => sel.appendChild(new Option(m, m)));
    if (previousSelections[id] && data.metrics.includes(previousSelections[id])) {
      sel.value = previousSelections[id];  // restore selection
    }
  });

  // rebuild metric count table
  const cntBody = document.getElementById('metricCounts');
  const counts  = {};
  data.metrics.forEach(m => counts[m] = 0);
  data.records.forEach(r => counts[r.metric]++);
  cntBody.innerHTML = '';
  Object.entries(counts)
        .sort((a,b) => b[1]-a[1])
        .forEach(([m,c]) => {
          cntBody.innerHTML += `<tr>
              <td>${m}</td><td>${c}</td>
              <td><button onclick="deleteMetric('${m}')">🗑️</button></td>
            </tr>`;
        });

  // default chart metric if none selected
  const topMetric = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const chartSel = document.getElementById('chartMetricSelect');
  if (!chartSel.value && topMetric) chartSel.value = topMetric;
}

/* ── RENDER RECORD TABLE ──────────────────────────────── */
function renderRecords() {
  const year   = document.getElementById('logYear').value;
  const month  = document.getElementById('logMonth').value;
  const day    = document.getElementById('logDay').value;
  const metric = document.getElementById('logMetric').value;

  const tbody = document.getElementById('recordTable');
  tbody.innerHTML = '';

  data.records.forEach((r, i) => {
    if (year   && r.date.slice(0, 4) !== year) return;
    if (month  && r.date.slice(5, 7) !== month.padStart(2, '0')) return;
    if (day    && r.date.slice(8, 10) !== day.padStart(2, '0')) return;
    if (metric && r.metric !== metric) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${r.metric}</td>
      <td>${r.value}</td>
      <td>${r.date}</td>
      <td>${r.timestamp.split('T')[1].split('.')[0]}</td>
      <td><button onclick="deleteRecord(${i})">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

/* ── RENDER CHART ─────────────────────────────────────── */
function renderChart() {
  const metric = document.getElementById('chartMetricSelect').value;
  if (!metric) { if (chart) chart.destroy(); return; }

  const year  = document.getElementById('chartYear').value;
  const month = document.getElementById('chartMonth').value;

  let rows = data.records.filter(r => r.metric === metric);
  if (year)  rows = rows.filter(r => r.date.startsWith(year));
  if (month) rows = rows.filter(r => r.date.slice(5,7) === month.padStart(2,'0'));

  const labels = rows.map(r => r.date);
  const values = rows.map(r => +r.value);

  if (chart) chart.destroy();
  const ctx = document.getElementById('chartCanvas').getContext('2d');
  chart = new Chart(ctx,{
    type:'line',
    data:{ labels,
      datasets:[{ label:metric,data:values,fill:false,borderColor:'#007BFF',tension:0.2 }]},
    options:{ responsive:true,
      scales:{ y:{min:1,max:5,ticks:{stepSize:1}}}}
  });
}

/* ── CLEAR CHART FILTERS ─────────────────────────────── */
function clearChartFilters() {
  ['chartYear','chartMonth'].forEach(id => document.getElementById(id).value = '');
  renderChart();
}

/* ── CSV I/O ──────────────────────────────────────────── */
function importCSV(ev){
  const f=ev.target.files[0]; if(!f)return;
  const rd=new FileReader();
  rd.onload=e=>{
    e.target.result.trim().split('\n').slice(1).forEach(l=>{
      const[metric,value,date,timestamp]=l.split(',');
      if(!data.metrics.includes(metric))data.metrics.push(metric);
      if(!data.records.some(r=>r.metric===metric&&r.timestamp===timestamp))
        data.records.push({metric,value,date,timestamp});
    });
    saveData();
  };
  rd.readAsText(f);
}

function downloadCSV(){
  let csv='metric,value,date,timestamp\n';
  data.records.forEach(r=>csv+=`${r.metric},${r.value},${r.date},${r.timestamp}\n`);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='likert_data.csv'; a.click(); URL.revokeObjectURL(a.href);
}

/* ── DATE SELECTOR POPULATION ────────────────────────── */
function populateDateSelectors() {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth() + 1, day = now.getDate();
  const pad = n => n.toString().padStart(2, '0');
  const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => i + start);

  // IDs grouped by function
  const recordSelectors = ['yearSelect', 'monthSelect', 'daySelect'];
  const filterSelectors = ['logYear', 'chartYear', 'logMonth', 'chartMonth', 'logDay'];

  // Add blank option to filters
  filterSelectors.forEach(id => {
    const el = document.getElementById(id);
    const blank = new Option('', '');
    blank.selected = true;
    el.appendChild(blank);
  });

  // Years
  range(year - 5, year + 1).forEach(y => {
    const opt = new Option(y, y);
    if (y === year) opt.selected = true;
    document.getElementById('yearSelect').appendChild(opt); // record tab
    ['logYear', 'chartYear'].forEach(id => document.getElementById(id).appendChild(new Option(y, y)));
  });

  // Months
  for (let m = 1; m <= 12; m++) {
    const opt = new Option(pad(m), pad(m));
    if (m === month) opt.selected = true;
    document.getElementById('monthSelect').appendChild(opt); // record tab
    ['logMonth', 'chartMonth'].forEach(id => document.getElementById(id).appendChild(new Option(pad(m), pad(m))));
  }

  // Days
  for (let d = 1; d <= 31; d++) {
    const opt = new Option(pad(d), pad(d));
    if (d === day) opt.selected = true;
    document.getElementById('daySelect').appendChild(opt); // record tab
    document.getElementById('logDay').appendChild(new Option(pad(d), pad(d)));
  }
}

/* ── LIVE SLIDER DISPLAY ─────────────────────────────── */
document.getElementById('sliderValue').addEventListener('input',
  e=>document.getElementById('sliderDisplay').textContent=e.target.value);

/* ── BOOTSTRAP ───────────────────────────────────────── */
populateDateSelectors();

function clearLogFilters() {
  ['logMetric', 'logYear', 'logMonth', 'logDay'].forEach(id => {
    document.getElementById(id).value = '';
  });
  renderRecords();
}

function renderAll(){ renderMetrics(); renderRecords(); renderChart(); }
renderAll();                           // initial paint
switchTab('homeTab');
  
