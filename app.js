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

function migrateDataIfNeeded() {
  // Migrate old data format to new format with scales
  if (data.metrics.length > 0 && typeof data.metrics[0] === 'string') {
    // Convert old string-based metrics to new object format
    const oldMetrics = data.metrics;
    data.metrics = oldMetrics.map(metric => ({
      name: metric,
      scale: 'likert' // Default to likert for existing metrics
    }));
    localStorage.setItem('likert_data', JSON.stringify(data));
  }
}

/* ── NAVIGATION ───────────────────────────────────────── */
function switchTab(id) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el  => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById(id + 'Btn').classList.add('active');
  
  // Update date/time selectors to current time when Record tab is opened
  if (id === 'recordTab') {
    updateDateTimeToCurrent();
  }
}

/* ── SCALE MANAGEMENT ─────────────────────────────────── */
function getScaleLabel(scale) {
  switch(scale) {
    case 'likert': return 'Likert (1-5)';
    case 'binary': return 'Binary (0-1)';
    case 'continuous': return 'Continuous (0-100)';
    default: return scale;
  }
}

function getScaleConfig(scale) {
  switch(scale) {
    case 'likert':
      return { min: 1, max: 5, step: 1, default: 3 };
    case 'binary':
      return { min: 0, max: 1, step: 1, default: 1 };
    case 'continuous':
      return { min: 0, max: 100, step: 5, default: 50 };
    default:
      return { min: 1, max: 5, step: 1, default: 3 };
  }
}

function updateSliderForMetric(metricName) {
  const metric = data.metrics.find(m => m.name === metricName);
  if (!metric) return;
  
  const config = getScaleConfig(metric.scale);
  const slider = document.getElementById('sliderValue');
  const display = document.getElementById('sliderDisplay');
  
  slider.min = config.min;
  slider.max = config.max;
  slider.step = config.step;
  slider.value = config.default;
  display.textContent = config.default;
}

/* ── METRIC CRUD ──────────────────────────────────────── */
function addMetric() {
  const input  = document.getElementById('newMetric');
  const scaleSelect = document.getElementById('metricScale');
  const metric = input.value.trim();
  const scale = scaleSelect.value;

  if (metric.length === 0) { alert('Metric name cannot be blank.'); return; }
  if (!scale) { alert('Please select a scale.'); return; }
  if (data.metrics.some(m => m.name === metric)) { alert('Metric already exists.'); return; }

  data.metrics.push({ name: metric, scale: scale });
  input.value = '';
  input.focus();
  saveData();
}

function deleteMetric(metricName) {
  if (!confirm(`Delete metric "${metricName}" and all its measurements?`)) return;
  data.metrics  = data.metrics.filter(m => m.name !== metricName);
  data.records  = data.records.filter(r => r.metric !== metricName);
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
  const h  = document.getElementById('hourSelect').value.padStart(2,'0');
  const date = `${y}-${m}-${d}`;
  
  // Create timestamp from selected date/time
  const timestamp = new Date(`${y}-${m}-${d}T${h}:00:00`).toISOString();

  data.records.push({ metric, value, date, timestamp });
  saveData();
}

function deleteRecord(index) {
  data.records.splice(index,1);
  saveData();
}

function deleteAllRecords() {
  if (!confirm('⚠️ WARNING: This will permanently delete ALL your records!\n\nThis action cannot be undone. Are you sure you want to continue?')) {
    return;
  }
  
  // Double confirmation for extra safety
  if (!confirm('Final confirmation: Delete ALL records?\n\nThis will remove all your tracking data permanently.')) {
    return;
  }
  
  data.records = [];
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
    data.metrics.forEach(m => sel.appendChild(new Option(m.name, m.name)));
    if (previousSelections[id] && data.metrics.some(m => m.name === previousSelections[id])) {
      sel.value = previousSelections[id];  // restore selection
    }
  });

  // Update slider if metricSelect has a value
  const metricSelect = document.getElementById('metricSelect');
  if (metricSelect.value) {
    updateSliderForMetric(metricSelect.value);
  }

  // Ensure event listener is attached
  metricSelect.onchange = (e) => updateSliderForMetric(e.target.value);

  // rebuild metric count table
  const cntBody = document.getElementById('metricCounts');
  const counts  = {};
  data.metrics.forEach(m => counts[m.name] = 0);
  data.records.forEach(r => counts[r.metric]++);
  cntBody.innerHTML = '';
  Object.entries(counts)
        .sort((a,b) => b[1]-a[1])
        .forEach(([m,c]) => {
          const metricObj = data.metrics.find(metric => metric.name === m);
          const scaleLabel = getScaleLabel(metricObj.scale);
          cntBody.innerHTML += `<tr>
              <td>${m}</td><td>${scaleLabel}</td><td>${c}</td>
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
    const metricObj = data.metrics.find(m => m.name === r.metric);
    const scaleLabel = metricObj ? getScaleLabel(metricObj.scale) : 'Unknown';
    row.innerHTML = `
      <td>${r.metric}</td>
      <td>${scaleLabel}</td>
      <td>${r.value}</td>
      <td>${r.date}</td>
      <td>${r.timestamp.split('T')[1].split('.')[0]}</td>
      <td><button onclick="deleteRecord(${i})">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

/* ── AGGREGATE DATA BY TIME PERIOD ───────────────────── */
function aggregateDataByPeriod(records, period) {
  const aggregated = {};
  
  records.forEach(record => {
    const date = new Date(record.date);
    const timestamp = new Date(record.timestamp);
    let key;
    let timeValue;
    
    switch(period) {
      case 'hour':
        // For hour aggregation, use the actual timestamp for proper time spacing
        timeValue = timestamp;
        key = `${record.date} ${timestamp.getHours().toString().padStart(2, '0')}:00`;
        break;
      case 'day':
        // For day aggregation, use start of day
        timeValue = new Date(date);
        key = record.date;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        timeValue = weekStart;
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        timeValue = new Date(date.getFullYear(), date.getMonth(), 1);
        key = record.date.substring(0, 7);
        break;
      case 'year':
        timeValue = new Date(date.getFullYear(), 0, 1);
        key = record.date.substring(0, 4);
        break;
    }
    
    if (!aggregated[key]) {
      aggregated[key] = { values: [], count: 0, timeValue: timeValue };
    }
    aggregated[key].values.push(+record.value);
    aggregated[key].count++;
  });
  
  // Calculate average for each period
  const result = Object.entries(aggregated).map(([key, data]) => ({
    period: key,
    timeValue: data.timeValue,
    average: data.values.reduce((a, b) => a + b, 0) / data.values.length,
    count: data.count
  }));
  
  return result.sort((a, b) => a.timeValue - b.timeValue);
}

/* ── RENDER CHART ─────────────────────────────────────── */
function renderChart() {
  const metric = document.getElementById('chartMetricSelect').value;
  if (!metric) { if (chart) chart.destroy(); return; }

  const metricObj = data.metrics.find(m => m.name === metric);
  const scaleConfig = getScaleConfig(metricObj.scale);

  const year  = document.getElementById('chartYear').value;
  const month = document.getElementById('chartMonth').value;
  const day   = document.getElementById('chartDay').value;
  const aggregation = document.getElementById('chartAggregation').value;

  let rows = data.records.filter(r => r.metric === metric);
  if (year)  rows = rows.filter(r => r.date.startsWith(year));
  if (month) rows = rows.filter(r => r.date.slice(5,7) === month.padStart(2,'0'));
  if (day)   rows = rows.filter(r => r.date.slice(8,10) === day.padStart(2,'0'));

  if (rows.length === 0) {
    if (chart) chart.destroy();
    return;
  }

  // Aggregate data based on selected period
  const aggregatedData = aggregateDataByPeriod(rows, aggregation);
  
  const timeValues = aggregatedData.map(d => d.timeValue);
  const values = aggregatedData.map(d => d.average);
  const counts = aggregatedData.map(d => d.count);

  // Also prepare raw data points for scatter plot
  const rawTimeValues = rows.map(r => new Date(r.timestamp));
  const rawValues = rows.map(r => +r.value);

  // Fix label text
  const getAggregationLabel = (agg) => {
    switch(agg) {
      case 'hour': return 'hourly';
      case 'day': return 'daily';
      case 'week': return 'weekly';
      case 'month': return 'monthly';
      case 'year': return 'yearly';
      default: return agg + 'ly';
    }
  };

  // Get time unit and display format based on aggregation
  const getTimeConfig = (agg) => {
    switch(agg) {
      case 'hour': return { unit: 'hour', displayFormats: { hour: 'MMM d, HH:mm' } };
      case 'day': return { unit: 'day', displayFormats: { day: 'MMM d' } };
      case 'week': return { unit: 'week', displayFormats: { week: 'MMM d' } };
      case 'month': return { unit: 'month', displayFormats: { month: 'MMM yyyy' } };
      case 'year': return { unit: 'year', displayFormats: { year: 'yyyy' } };
      default: return { unit: 'day', displayFormats: { day: 'MMM d' } };
    }
  };

  const timeConfig = getTimeConfig(aggregation);

  if (chart) chart.destroy();
  const ctx = document.getElementById('chartCanvas').getContext('2d');
  
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: `${metric} (raw data)`,
          data: rawTimeValues.map((time, index) => ({
            x: time,
            y: rawValues[index]
          })),
          backgroundColor: 'rgba(0, 123, 255, 0.3)',
          borderColor: 'rgba(0, 123, 255, 0.6)',
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0,
          showLine: false // Only show points, not connecting lines
        },
        {
          label: `${metric} (trend)`,
          data: timeValues.map((time, index) => ({
            x: time,
            y: values[index]
          })),
          backgroundColor: 'rgba(220, 53, 69, 0.6)',
          borderColor: 'rgba(220, 53, 69, 1)',
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            title: function(context) {
              const date = new Date(context[0].parsed.x);
              switch(aggregation) {
                case 'hour': return date.toLocaleString('en-US', { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
                case 'day': return date.toLocaleDateString('en-US', { 
                  month: 'short', day: 'numeric' 
                });
                case 'week': return `Week of ${date.toLocaleDateString('en-US', { 
                  month: 'short', day: 'numeric' 
                })}`;
                case 'month': return date.toLocaleDateString('en-US', { 
                  month: 'short', year: 'numeric' 
                });
                case 'year': return date.getFullYear().toString();
                default: return date.toLocaleDateString();
              }
            },
            label: function(context) {
              const datasetIndex = context[0].datasetIndex;
              const dataIndex = context[0].dataIndex;
              
              if (datasetIndex === 0) {
                // Raw data points
                return `Raw Value: ${rawValues[dataIndex]}`;
              } else {
                // Trend line points
                return [
                  `Average: ${values[dataIndex].toFixed(2)}`,
                  `Records: ${counts[dataIndex]}`
                ];
              }
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: timeConfig.unit,
            displayFormats: timeConfig.displayFormats
          },
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          min: scaleConfig.min,
          max: scaleConfig.max,
          ticks: { stepSize: scaleConfig.step },
          title: {
            display: true,
            text: 'Value'
          }
        }
      }
    }
  });
}

/* ── CLEAR CHART FILTERS ─────────────────────────────── */
function clearChartFilters() {
  ['chartYear','chartMonth','chartDay'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('chartAggregation').value = 'hour'; // Reset to default
  renderChart();
}

/* ── CSV I/O ──────────────────────────────────────────── */
function importCSV(ev){
  const f=ev.target.files[0]; if(!f)return;
  const rd=new FileReader();
  rd.onload=e=>{
    const lines = e.target.result.trim().split('\n');
    const header = lines[0].split(',');
    const hasScale = header.includes('scale');
    
    lines.slice(1).forEach(l=>{
      const values = l.split(',');
      let metric, scale, value, date, timestamp;
      
      if (hasScale) {
        [metric, scale, value, date, timestamp] = values;
      } else {
        // Handle old format without scale
        [metric, value, date, timestamp] = values;
        scale = 'likert'; // Default to likert for old data
      }
      
      if(!data.metrics.some(m=>m.name===metric)) {
        data.metrics.push({name: metric, scale: scale});
      }
      if(!data.records.some(r=>r.metric===metric&&r.timestamp===timestamp)) {
        data.records.push({metric, value, date, timestamp});
      }
    });
    saveData();
  };
  rd.readAsText(f);
}

function downloadCSV(){
  let csv='metric,scale,value,date,timestamp\n';
  data.records.forEach(r => {
    const metricObj = data.metrics.find(m => m.name === r.metric);
    const scale = metricObj ? metricObj.scale : 'likert';
    csv+=`${r.metric},${scale},${r.value},${r.date},${r.timestamp}\n`;
  });
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='likert_data.csv'; a.click(); URL.revokeObjectURL(a.href);
}

/* ── UPDATE DATE/TIME TO CURRENT ─────────────────────── */
function updateDateTimeToCurrent() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  
  document.getElementById('yearSelect').value = year;
  document.getElementById('monthSelect').value = month;
  document.getElementById('daySelect').value = day;
  document.getElementById('hourSelect').value = hour;
}

/* ── DATE SELECTOR POPULATION ────────────────────────── */
function populateDateSelectors() {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth() + 1, day = now.getDate(), hour = now.getHours();
  const pad = n => n.toString().padStart(2, '0');
  const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => i + start);

  // IDs grouped by function
  const recordSelectors = ['yearSelect', 'monthSelect', 'daySelect', 'hourSelect'];
  const filterSelectors = ['logYear', 'chartYear', 'logMonth', 'chartMonth', 'logDay', 'chartDay'];

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
    document.getElementById('chartDay').appendChild(new Option(pad(d), pad(d)));
  }

  // Hours (0-23)
  for (let h = 0; h <= 23; h++) {
    const opt = new Option(pad(h), pad(h));
    if (h === hour) opt.selected = true;
    document.getElementById('hourSelect').appendChild(opt); // record tab
  }
}

/* ── LIVE SLIDER DISPLAY ─────────────────────────────── */
document.getElementById('sliderValue').addEventListener('input',
  e=>document.getElementById('sliderDisplay').textContent=e.target.value);

/* ── BOOTSTRAP ───────────────────────────────────────── */
populateDateSelectors();
migrateDataIfNeeded(); // Call migration after DOM is ready

function clearLogFilters() {
  ['logMetric', 'logYear', 'logMonth', 'logDay'].forEach(id => {
    document.getElementById(id).value = '';
  });
  renderRecords();
}

function renderAll(){ renderMetrics(); renderRecords(); renderChart(); }
renderAll();                           // initial paint
switchTab('homeTab');
