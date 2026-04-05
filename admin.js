// ═══ HR DASHBOARD ═══
let hrTab = 'overview';
let salaryEmpId = null;
let selectedEmp = null;
let baseSalary = 0;
let adjustments = [];
let salaryMonth = new Date().toISOString().slice(0,7);
let adjType = 'bonus';
const adjColors = {
  bonus:     {label:'Bonus',     color:'#22c55e', bg:'rgba(34,197,94,.08)',   sign:'+'},
  allowance: {label:'Allowance', color:'#3b82f6', bg:'rgba(59,130,246,.08)',  sign:'+'},
  overtime:  {label:'Overtime',  color:'#f59e0b', bg:'rgba(245,158,11,.08)',  sign:'+'},
  absence:   {label:'Absence',   color:'#ef4444', bg:'rgba(239,68,68,.08)',   sign:'-'},
  deduction: {label:'Deduction', color:'#8b5cf6', bg:'rgba(139,92,246,.08)', sign:'-'},
};

async function initHR() {
  updateLangBtns();
  updateStaticText();
  applyDark();
  const tabs = [
    {id:'overview',   icon:'📊', label:t().overview},
    {id:'attendance', icon:'📍', label:t().attendance_tab},
    {id:'leaves',     icon:'🌴', label:t().leaves_tab},
    {id:'employees',  icon:'👥', label:t().employees_tab},
    {id:'salaries',   icon:'💰', label:lang==='ar'?'المرتبات':'Salaries'},
    {id:'notifs',     icon:'🔔', label:t().notifs_tab},
    {id:'tasks',      icon:'✅', label:lang==='ar'?'التاسكات':'Tasks'},
    {id:'empfiles',   icon:'📁', label:lang==='ar'?'ملفات':'Files'},
    {id:'export',     icon:'📤', label:t().export_tab},
  ];
  $('hrApp').innerHTML = `
    <div style="display:flex;flex-direction:column;height:100vh">
      <div style="background:var(--surface);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
        <div style="font-size:18px;font-weight:800;color:var(--sky)">MERGE HR</div>
        <div style="display:flex;gap:8px">
          <button onclick="toggleLang()" style="background:var(--input-bg);border:1px solid var(--border);border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:700" id="hrLangBtn">${lang==='en'?'عربي':'EN'}</button>
          <button onclick="handleLogout()" style="background:var(--red);color:#fff;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:700">🚪 ${t().logout}</button>
        </div>
      </div>
      <div style="display:flex;flex:1;overflow:hidden">
        <div style="background:var(--surface-2);border-${lang==='ar'?'left':'right'}:1px solid var(--border);padding:8px;overflow-y:auto;width:120px;flex-shrink:0">
          ${tabs.map(tb=>`
            <button onclick="showHRTab('${tb.id}')"
              style="width:100%;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;margin-bottom:4px;border-radius:10px;font-size:11px;text-align:center;border:none;cursor:pointer;font-family:inherit;font-weight:${tb.id===hrTab?'800':'600'};background:${tb.id===hrTab?'var(--indigo-dim)':'transparent'};color:${tb.id===hrTab?'var(--indigo)':'var(--muted)'};transition:all .15s;outline:${tb.id===hrTab?'1.5px solid var(--indigo-mid)':'none'}">
              <span style="font-size:22px">${tb.icon}</span>
              <span>${tb.label}</span>
            </button>
          `).join('')}
        </div>
        <div style="flex:1;overflow-y:auto;padding:16px" id="hrContent"></div>
      </div>
    </div>
  `;
  renderHR(hrTab);
}

// ✅ FIX: reset stale IDs when switching tabs
function showHRTab(tab) {
  hrTab = tab;
  empSearchTerm = '';
  if(tab !== 'salaries') { salaryEmpId = null; selectedEmp = null; }
  if(tab !== 'empfiles') filesEmpId = null;
  if(tab !== 'tasks')    taskEmpId = null;
  initHR();
}

async function renderHR(tab) {
  const el = $('hrContent');
  el.innerHTML = '<div style="text-align:center;padding:60px 0"><div class="spinner" style="margin:auto"></div></div>';
  if(tab==='overview')        await renderHROverview();
  else if(tab==='attendance') await renderHRAttendance();
  else if(tab==='leaves')     await renderHRLeaves();
  else if(tab==='employees')  await renderHREmployees();
  else if(tab==='salaries')   await renderHRSalaries();
  else if(tab==='notifs')     renderHRNotifs();
  else if(tab==='tasks')      await renderHRTasks();
  else if(tab==='empfiles')   await renderHRFiles();
  else if(tab==='export')     renderHRExport();
}

async function renderHROverview() {
  const today = nowISO();
  const [{count:total},{data:attRaw},{count:pending}] = await Promise.all([
    sb.from('employees').select('*',{count:'exact',head:true}).eq('status','active'),
    sb.from('attendance_records').select('*').eq('attendance_date',today),
    sb.from('leave_requests').select('*',{count:'exact',head:true}).eq('status','pending'),
  ]);

  let att = attRaw||[];
  if(att.length>0) {
    const ids = [...new Set(att.map(a=>a.employee_id).filter(Boolean))];
    const {data:emps} = await sb.from('employees').select('id,first_name,last_name,department').in('id',ids);
    const empMap = {};
    (emps||[]).forEach(e => empMap[e.id] = e);
    att = att.map(a=>({...a, employees: empMap[a.employee_id]}));
  }

  const present = att.length;
  const absent  = (total||0) - present;
  const late    = att.filter(a => a.check_in_time && a.check_in_time > '09:15:00');
  const onTime  = att.filter(a => a.check_in_time && a.check_in_time <= '09:15:00');

  $('hrContent').innerHTML = `
    <div class="hr-stat-grid">
      <div class="hr-stat">
        <div class="hr-stat-icon" style="background:rgba(56,189,248,.1)">👥</div>
        <div class="hr-stat-val" style="color:var(--sky)">${total||0}</div>
        <div class="hr-stat-label">${t().total_employees}</div>
      </div>
      <div class="hr-stat">
        <div class="hr-stat-icon" style="background:rgba(34,197,94,.1)">✅</div>
        <div class="hr-stat-val" style="color:var(--green)">${present}</div>
        <div class="hr-stat-label">${t().present}</div>
      </div>
      <div class="hr-stat">
        <div class="hr-stat-icon" style="background:rgba(239,68,68,.1)">❌</div>
        <div class="hr-stat-val" style="color:var(--red)">${absent}</div>
        <div class="hr-stat-label">${t().absent}</div>
      </div>
      <div class="hr-stat">
        <div class="hr-stat-icon" style="background:rgba(245,158,11,.1)">🌴</div>
        <div class="hr-stat-val" style="color:var(--amber)">${pending||0}</div>
        <div class="hr-stat-label">${t().pending_leaves}</div>
      </div>
    </div>

    ${late.length>0?`
      <div class="sec-title" style="color:var(--red)">⚠️ ${lang==='ar'?'متأخرون اليوم':'Late Today'} (${late.length})</div>
      ${late.map(a=>{
        const emp = a.employees;
        const name = emp?`${emp.first_name} ${emp.last_name}`:'—';
        const dept = emp?.department||'';
        const mins = Math.round((new Date('1970-01-01T'+a.check_in_time)-new Date('1970-01-01T09:15:00'))/60000);
        return `<div class="card-sm" style="border-color:rgba(239,68,68,.3);margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:20px;background:rgba(239,68,68,.1);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">⏰</div>
            <div style="flex:1">
              <div style="font-weight:700;color:var(--text);font-size:14px">${name}</div>
              <div style="font-size:11px;color:var(--sub);margin-top:2px">${dept}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:15px;font-weight:800;color:var(--red)">${fmtTime(a.check_in_time)}</div>
              <div style="font-size:11px;color:var(--red);margin-top:2px">+${mins} ${lang==='ar'?'دقيقة':'min'}</div>
            </div>
          </div>
        </div>`;
      }).join('')}
    `:''}

    ${onTime.length>0?`
      <div class="sec-title" style="color:var(--green)">✅ ${lang==='ar'?'في الوقت':'On Time'} (${onTime.length})</div>
      ${onTime.map(a=>{
        const emp = a.employees;
        const name = emp?`${emp.first_name} ${emp.last_name}`:'—';
        return `<div class="card-sm" style="border-color:rgba(34,197,94,.2);margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:20px;background:rgba(34,197,94,.1);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">✅</div>
            <div style="flex:1"><div style="font-weight:700;color:var(--text);font-size:14px">${name}</div></div>
            <div style="font-size:15px;font-weight:800;color:var(--green)">${fmtTime(a.check_in_time)}</div>
          </div>
        </div>`;
      }).join('')}
    `:''}

    ${att.length===0?`
      <div class="card" style="text-align:center;padding:32px">
        <div style="font-size:44px;margin-bottom:8px">📭</div>
        <div style="color:var(--sub)">${t().no_att_today}</div>
      </div>
    `:''}
  `;
}

// ✅ FIX: safe init with fallback
let attDate = new Date().toISOString().split('T')[0];

async function renderHRAttendance() {
  $('hrContent').innerHTML = '<div style="text-align:center;padding:60px 0"><div class="spinner" style="margin:auto"></div></div>';

  // ✅ FIX: guard empty date
  const safeDate = attDate || new Date().toISOString().split('T')[0];

  const {data:att, error:attErr} = await sb
    .from('attendance_records')
    .select('*')
    .eq('attendance_date', safeDate)
    .order('check_in_time', {ascending:false});

  if(attErr) {
    $('hrContent').innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-title">${attErr.message}</div></div>`;
    return;
  }

  const items = att||[];
  let empMap = {};
  if(items.length > 0) {
    const ids = [...new Set(items.map(a=>a.employee_id).filter(Boolean))];
    const {data:emps} = await sb.from('employees').select('id,first_name,last_name,employee_code,department').in('id', ids);
    (emps||[]).forEach(e => empMap[e.id] = e);
  }

  $('hrContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <div style="font-size:18px;font-weight:800;color:var(--text)">${t().attendance_tab} (${items.length})</div>
      <input type="date" class="form-input" style="width:auto;padding:8px 12px"
        value="${safeDate}"
        onchange="attDate=this.value||'${safeDate}';renderHRAttendance()"/>
    </div>
    ${items.length===0
      ?`<div class="empty"><div class="empty-icon">📭</div><div class="empty-title">${t().no_att_today}</div><div class="empty-sub">${safeDate}</div></div>`
      :items.map(a=>{
        const emp = empMap[a.employee_id]||{};
        const name = emp.first_name?`${emp.first_name} ${emp.last_name}`:`ID: ${(a.employee_id||'').slice(0,8)}`;
        const sub  = [emp.employee_code,emp.department].filter(Boolean).join(' · ')||'—';
        return `<div class="card-sm">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <div style="font-weight:700;color:var(--text);font-size:14px">${name}</div>
              <div style="font-size:11px;color:var(--sub);margin-top:2px">${sub}</div>
            </div>
            <span class="badge" style="background:${a.check_out_time?'rgba(99,102,241,.1)':'rgba(34,197,94,.1)'};color:${a.check_out_time?'var(--indigo)':'var(--green)'};border:1px solid ${a.check_out_time?'rgba(99,102,241,.2)':'rgba(34,197,94,.2)'}">
              ${a.check_out_time?(lang==='ar'?'مكتمل':'Complete'):(lang==='ar'?'نشط':'Active')}
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="background:rgba(34,197,94,.08);border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--green);font-weight:700;margin-bottom:3px">${t().check_in_label.toUpperCase()}</div>
              <div style="font-size:17px;font-weight:800;color:var(--green)">${fmtTime(a.check_in_time)}</div>
            </div>
            <div style="background:rgba(239,68,68,.08);border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--red);font-weight:700;margin-bottom:3px">${t().check_out_label.toUpperCase()}</div>
              <div style="font-size:17px;font-weight:800;color:${a.check_out_time?'var(--red)':'var(--muted)'}"> ${fmtTime(a.check_out_time)}</div>
            </div>
          </div>
        </div>`;
      }).join('')}
  `;
}

async function renderHRLeaves() {
  const {data:leaves} = await sb.from('leave_requests').select('*,employees(first_name,last_name,department)').order('created_at',{ascending:false});
  const items = leaves||[];
  $('hrContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-size:18px;font-weight:800;color:var(--text)">${t().leaves_tab}</div>
      <span class="badge" style="background:rgba(245,158,11,.1);color:var(--amber);border:1px solid rgba(245,158,11,.2)">${items.filter(l=>l.status==='pending').length} ${t().under_review}</span>
    </div>
    ${items.length===0
      ?`<div class="empty"><div class="empty-icon">🌴</div><div class="empty-title">${lang==='ar'?'لا توجد طلبات':'No leave requests'}</div></div>`
      :items.map(lv=>`<div class="leave-card" style="border-color:${lv.status==='pending'?'rgba(245,158,11,.35)':''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <div style="font-weight:700;color:var(--text);font-size:15px">${lv.employees?.first_name||''} ${lv.employees?.last_name||''}</div>
              <div style="font-size:11px;color:var(--sub);margin-top:2px">${lv.employees?.department||''}</div>
            </div>
            <span class="badge" style="background:${statusColor(lv.status)}20;color:${statusColor(lv.status)};border:1px solid ${statusColor(lv.status)}30">${lv.status?.toUpperCase()}</span>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <span class="badge" style="background:rgba(99,102,241,.1);color:var(--indigo);border:1px solid rgba(99,102,241,.2)">${lv.leave_type}</span>
            <span class="badge" style="background:rgba(245,158,11,.1);color:var(--amber);border:1px solid rgba(245,158,11,.2)">
              ${Math.ceil((new Date(lv.end_date)-new Date(lv.start_date))/86400000)+1} ${lang==='ar'?'يوم':'days'}
            </span>
          </div>
          <div style="font-size:13px;color:var(--sub);margin-bottom:8px">📅 ${fmtDate(lv.start_date)} — ${fmtDate(lv.end_date)}</div>
          ${lv.reason?`<div style="font-size:12px;color:var(--muted);margin-bottom:10px;font-style:italic">"${lv.reason}"</div>`:''}
          ${lv.status==='pending'?`
        <div style="display:flex;gap:8px">
         <button class="primary-btn" style="flex:1;background:var(--green);padding:8px" onclick="approveLeave('${lv.id}')">${t().approve}</button>
        <button class="primary-btn" style="flex:1;background:var(--red);padding:8px" onclick="rejectLeave('${lv.id}')">${t().reject}</button>
        <button class="primary-btn" style="background:rgba(239,68,68,.15);color:var(--red);padding:8px;border:1px solid rgba(239,68,68,.2);box-shadow:none" onclick="deleteLeave('${lv.id}','${lv.status}','${lv.employee_id}','${lv.start_date}','${lv.end_date}','${lv.leave_type}')">🗑️</button>
  </div>`:`
  <div style="display:flex;gap:8px;margin-top:8px">
    <button class="primary-btn" style="width:100%;background:rgba(239,68,68,.15);color:var(--red);padding:8px;border:1px solid rgba(239,68,68,.2);box-shadow:none" onclick="deleteLeave('${lv.id}','${lv.status}','${lv.employee_id}','${lv.start_date}','${lv.end_date}','${lv.leave_type}')">🗑️ ${lang==='ar'?'حذف':'Delete'}</button>
  </div>`}
        </div>`).join('')}
  `;
}

async function approveLeave(id) {
  const {data:lv,error:lvErr} = await sb.from('leave_requests').select('*').eq('id',id).single();
  if(lvErr) return toast(lvErr.message,'error');
  const DEDUCTIBLE = ['annual','sick','emergency'];
  const days = Math.ceil((new Date(lv.end_date)-new Date(lv.start_date))/86400000)+1;
  if(DEDUCTIBLE.includes(lv.leave_type?.toLowerCase())) {
    const {data:emp} = await sb.from('employees').select('leave_balance').eq('id',lv.employee_id).single();
    const currentBal = emp?.leave_balance??21;
    await sb.from('employees').update({leave_balance:Math.max(0,currentBal-days)}).eq('id',lv.employee_id);
  }
  const {error} = await sb.from('leave_requests').update({status:'approved'}).eq('id',id);
  if(error) return toast(error.message,'error');
  toast(lang==='ar'?`تمت الموافقة — تم خصم ${days} يوم ✅`:`Approved — ${days} days deducted ✅`,'success');
  renderHR('leaves');
}

async function rejectLeave(id) {
  const {data:lv} = await sb.from('leave_requests').select('*').eq('id',id).single();
  const DEDUCTIBLE = ['annual','sick','emergency'];
  if(lv?.status==='approved'&&DEDUCTIBLE.includes(lv.leave_type?.toLowerCase())) {
    const days = Math.ceil((new Date(lv.end_date)-new Date(lv.start_date))/86400000)+1;
    const {data:emp} = await sb.from('employees').select('leave_balance').eq('id',lv.employee_id).single();
    await sb.from('employees').update({leave_balance:(emp?.leave_balance??0)+days}).eq('id',lv.employee_id);
  }
  const {error} = await sb.from('leave_requests').update({status:'rejected'}).eq('id',id);
  if(error) return toast(error.message,'error');
  toast(lang==='ar'?'تم رفض الطلب':'Leave rejected','success');
  renderHR('leaves');
}

let empSearchTerm = '';
async function renderHREmployees() {
  const {data:emps} = await sb.from('employees').select('*').order('first_name');
  const items = emps||[];
  const filtered = items.filter(e=>
    e.first_name?.toLowerCase().includes(empSearchTerm.toLowerCase())||
    e.last_name?.toLowerCase().includes(empSearchTerm.toLowerCase())||
    e.employee_code?.toLowerCase().includes(empSearchTerm.toLowerCase())
  );
  $('hrContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-size:18px;font-weight:800;color:var(--text)">${t().employees_tab}</div>
      <button class="primary-btn" onclick="openModal('addEmpModal')">${t().add_employee}</button>
    </div>
    <!-- ✅ FIX: oninput for real-time search -->
    <input class="form-input" type="text" placeholder="${t().search_emp}" value="${empSearchTerm}"
      oninput="empSearchTerm=this.value;renderHR('employees')" style="margin-bottom:14px"/>
    ${filtered.length===0
      ?`<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">${lang==='ar'?'لا يوجد موظفون':'No employees found'}</div></div>`
      :filtered.map(e=>`<div class="card-sm">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1">
              <div style="font-weight:700;color:var(--text);font-size:14px">${e.first_name} ${e.last_name}</div>
              <div style="font-size:11px;color:var(--sub);margin-top:2px">${e.employee_code||''} · ${e.job_title||e.position||''}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:4px">${e.email||''}</div>
            </div>
            <span class="badge" style="background:${e.status==='active'?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)'};color:${e.status==='active'?'var(--green)':'var(--red)'};border:1px solid ${e.status==='active'?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}">${e.status==='active'?t().active_st:t().inactive_st}</span>
          </div>
        </div>`).join('')}
  `;
}

async function addEmployee() {
  const first=$('ae_first')?.value?.trim(), last=$('ae_last')?.value?.trim(), email=$('ae_email')?.value?.trim();
  const pos=$('ae_position')?.value?.trim(), dept=$('ae_dept')?.value?.trim();
  const phone=$('ae_phone')?.value?.trim(), hire=$('ae_hire')?.value;
  if(!first||!last||!email) return toast(lang==='ar'?'الرجاء ملء الحقول المطلوبة':'Fill required fields','error');
  try {
    const {error} = await sb.from('employees').insert([{first_name:first,last_name:last,email,job_title:pos,department:dept,phone,hire_date:hire,status:'active'}]);
    if(error) return toast(error.message,'error');
    toast(lang==='ar'?'تمت إضافة الموظف ✅':'Employee added ✅','success');
    closeModal('addEmpModal');
    renderHR('employees');
  } catch(e){toast(e.message,'error');}
}

async function renderHRSalaries() {
  const {data:emps} = await sb.from('employees').select('*').eq('status','active').order('first_name');
  const items = emps||[];

  // ✅ FIX: guard empty list
  if(items.length===0) {
    $('hrContent').innerHTML=`<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">${lang==='ar'?'لا يوجد موظفون نشطون':'No active employees'}</div></div>`;
    return;
  }

  // ✅ FIX: always sync selectedEmp correctly
  if(!salaryEmpId) {
    salaryEmpId = items[0].id;
    selectedEmp = items[0];
  } else {
    selectedEmp = items.find(e=>e.id===salaryEmpId)||items[0];
    salaryEmpId = selectedEmp.id;
  }

  const {data:sal} = await sb.from('salaries').select('*').eq('employee_id',salaryEmpId).order('effective_date',{ascending:false}).limit(1).maybeSingle();
  baseSalary = sal?.base_salary||0;
  const {data:adjs} = await sb.from('salary_adjustments').select('*').eq('employee_id',salaryEmpId).eq('month',salaryMonth+'-01');
  adjustments = adjs||[];

  const netSalary = baseSalary+adjustments.reduce((sum,a)=>{
    const isPos=['overtime','bonus','allowance'].includes(a.type);
    return sum+(isPos?a.amount:-a.amount);
  },0);

  $('hrContent').innerHTML=`
    <div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:14px">💰 ${lang==='ar'?'المرتبات':'Salaries'}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
      <div class="form-field" style="margin:0">
        <label class="field-label">${lang==='ar'?'الموظف':'Employee'}</label>
        <select class="form-input" onchange="salaryEmpId=this.value;renderHRSalaries()">
          ${items.map(e=>`<option value="${e.id}" ${e.id===salaryEmpId?'selected':''}>${e.first_name} ${e.last_name}</option>`).join('')}
        </select>
      </div>
      <div class="form-field" style="margin:0">
        <label class="field-label">${lang==='ar'?'الشهر':'Month'}</label>
        <input class="form-input" type="month" value="${salaryMonth}" onclick="try{this.showPicker()}catch(e){}" onchange="salaryMonth=this.value;renderHRSalaries()"/>
      </div>
    </div>
    <div class="card" style="margin-bottom:12px;border:1.5px solid rgba(56,189,248,.2)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div style="width:48px;height:48px;border-radius:24px;background:var(--sky);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff">${selectedEmp?.first_name?.[0]||'?'}${selectedEmp?.last_name?.[0]||''}</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--text)">${selectedEmp?.first_name||''} ${selectedEmp?.last_name||''}</div>
          <div style="font-size:12px;color:var(--sub)">${selectedEmp?.job_title||''} · ${selectedEmp?.department||''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--surface-2);border-radius:12px;margin-bottom:10px">
        <div style="font-size:13px;font-weight:600;color:var(--sub)">${lang==='ar'?'المرتب الأساسي':'Base Salary'}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="number" id="baseSalInput" value="${baseSalary}" min="0"
            style="width:110px;height:36px;background:var(--input-bg);border:1.5px solid var(--border);border-radius:10px;padding:0 10px;font-size:14px;font-weight:700;color:var(--text);font-family:inherit;outline:none;text-align:center"
            onfocus="this.style.borderColor='var(--sky)'" onblur="this.style.borderColor='var(--border)'"/>
          <button onclick="saveBaseSalary()" style="height:36px;padding:0 14px;background:var(--sky);border:none;border-radius:10px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">${lang==='ar'?'حفظ':'Save'}</button>
        </div>
      </div>
      ${adjustments.length>0?`
        <div style="margin-bottom:10px">
          ${adjustments.map(a=>{
            const c=adjColors[a.type]||adjColors.bonus;
            return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:${c.bg};border-radius:10px;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="badge" style="background:${c.bg};color:${c.color};border:1px solid ${c.color}30">${c.label}</span>
                <span style="font-size:12px;color:var(--sub)">${a.reason||''}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:15px;font-weight:800;color:${c.color}">${c.sign}${Math.abs(a.amount).toLocaleString()} ${lang==='ar'?'ج':'EGP'}</span>
                <button onclick="deleteAdj('${a.id}')" style="background:rgba(239,68,68,.15);border:none;border-radius:8px;width:28px;height:28px;cursor:pointer;color:var(--red);font-size:14px">✕</button>
              </div>
            </div>`;
          }).join('')}
        </div>`:''}
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:${netSalary>=baseSalary?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)'};border:1.5px solid ${netSalary>=baseSalary?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'};border-radius:14px">
        <div style="font-size:14px;font-weight:700;color:var(--text)">💰 ${lang==='ar'?'الصافي':'Net Salary'}</div>
        <div style="font-size:22px;font-weight:900;color:${netSalary>=baseSalary?'var(--green)':'var(--red)'}">
          ${netSalary.toLocaleString()} ${lang==='ar'?'ج':'EGP'}
        </div>
      </div>
    </div>
    <div class="card">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">➕ ${lang==='ar'?'إضافة تعديل':'Add Adjustment'}</div>
      <div class="chip-row" style="margin-bottom:12px">
        ${Object.entries(adjColors).map(([id,c])=>`
          <button class="chip ${adjType===id?'active':''}" onclick="adjType='${id}';renderHRSalaries()"
            style="${adjType===id?`background:${c.color};border-color:${c.color};color:#fff`:''}">${c.sign} ${c.label}</button>
        `).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div class="form-field" style="margin:0">
          <label class="field-label">${lang==='ar'?'المبلغ':'Amount'}</label>
          <input class="form-input" type="number" id="adjAmount" placeholder="0" min="0"/>
        </div>
        <div class="form-field" style="margin:0">
          <label class="field-label">${lang==='ar'?'السبب':'Reason'}</label>
          <input class="form-input" type="text" id="adjReason" placeholder="${lang==='ar'?'مثل: 3 أيام غياب':'e.g. 2 days absence'}"/>
        </div>
      </div>
      <button class="primary-btn" onclick="addAdjustment()">${lang==='ar'?'إضافة':'Add'} ${adjColors[adjType]?.label}</button>
    </div>
  `;
}

async function saveBaseSalary() {
  const val=parseFloat($('baseSalInput')?.value||0);
  if(isNaN(val)||val<0) return toast(lang==='ar'?'مبلغ غير صحيح':'Invalid amount','error');
  const {data:ex}=await sb.from('salaries').select('id').eq('employee_id',salaryEmpId).limit(1).maybeSingle();
  let error;
  if(ex){({error}=await sb.from('salaries').update({base_salary:val,effective_date:nowISO()}).eq('id',ex.id));}
  else{({error}=await sb.from('salaries').insert([{employee_id:salaryEmpId,base_salary:val,effective_date:nowISO()}]));}
  if(error) return toast(error.message,'error');
  toast(lang==='ar'?'تم حفظ المرتب ✅':'Salary saved ✅','success');
  renderHRSalaries();
}

async function addAdjustment() {
  const amount=parseFloat($('adjAmount')?.value||0);
  const reason=$('adjReason')?.value?.trim();
  if(!amount||amount<=0) return toast(lang==='ar'?'أدخل مبلغاً':'Enter amount','error');
  const {error}=await sb.from('salary_adjustments').insert([{employee_id:salaryEmpId,type:adjType,amount,reason,month:salaryMonth+'-01',created_by:currentEmployee.id}]);
  if(error) return toast(error.message,'error');
  toast(lang==='ar'?'تمت الإضافة ✅':'Added ✅','success');
  renderHRSalaries();
}

async function deleteAdj(id) {
  showConfirm({
    icon:'🗑️', title:lang==='ar'?'حذف التعديل':'Delete Adjustment',
    msg:lang==='ar'?'هل أنت متأكد من حذف هذا التعديل؟':'Are you sure you want to delete this adjustment?',
    okLabel:lang==='ar'?'حذف':'Delete', okColor:'var(--red)',
    onOk:async()=>{
      const {error}=await sb.from('salary_adjustments').delete().eq('id',id);
      if(error) return toast(error.message,'error');
      toast(lang==='ar'?'تم الحذف':'Deleted','success');
      renderHRSalaries();
    }
  });
}

let notifType='announcement';
function renderHRNotifs() {
  $('hrContent').innerHTML=`
    <div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:14px">${t().send_notif}</div>
    <div class="chip-row" style="margin-bottom:14px">
      <button class="chip ${notifType==='announcement'?'active':''}" onclick="notifType='announcement';renderHRNotifs()">📢 ${t().announcement}</button>
      <button class="chip ${notifType==='reminder'?'active':''}" onclick="notifType='reminder';renderHRNotifs()">⏰ ${t().reminder}</button>
      <button class="chip ${notifType==='alert'?'active':''}" onclick="notifType='alert';renderHRNotifs()">🚨 ${t().alert}</button>
    </div>
    <div class="form-field">
      <label class="field-label">${t().notif_text}</label>
      <textarea class="form-input" id="notif_title" placeholder="${lang==='ar'?'العنوان...':'Title...'}" style="margin-bottom:10px"></textarea>
      <textarea class="form-input" id="notif_msg" placeholder="${t().write_text}"></textarea>
    </div>
    <button class="primary-btn" onclick="sendNotif()" style="width:100%">${t().send_all}</button>
  `;
}

async function sendNotif() {
  const title=$('notif_title')?.value?.trim(), msg=$('notif_msg')?.value?.trim();
  if(!title||!msg) return toast(lang==='ar'?'الرجاء ملء جميع الحقول':'Fill all fields','error');
  const {error}=await sb.from('notifications').insert([{title,message:msg,type:notifType,is_read:false}]);
  if(error) return toast(error.message,'error');
  toast(lang==='ar'?'تم الإرسال ✅':'Notification sent ✅','success');
  renderHRNotifs();
}

function renderHRExport() {
  $('hrContent').innerHTML=`
    <div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:14px">${t().export}</div>
    <div class="card">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">📊 ${t().attendance_tab}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div class="form-field" style="margin:0">
          <label class="field-label">${t().from_date}</label>
          <input class="form-input" type="date" id="exp_from"/>
        </div>
        <div class="form-field" style="margin:0">
          <label class="field-label">${t().to_date}</label>
          <input class="form-input" type="date" id="exp_to"/>
        </div>
      </div>
      <button class="primary-btn" onclick="exportAttendance()" style="width:100%">${t().generate_download}</button>
    </div>
  `;
}

async function exportAttendance() {
  const from=$('exp_from')?.value, to=$('exp_to')?.value;
  if(!from||!to) return toast(lang==='ar'?'اختر التاريخ':'Select date range','error');
  toast(lang==='ar'?'جاري التحضير...':'Preparing...','');
  const {data,error}=await sb.from('attendance_records').select('*').gte('attendance_date',from).lte('attendance_date',to).order('attendance_date');
  if(error) return toast(error.message,'error');
  if(!data||data.length===0) return toast(lang==='ar'?'لا توجد بيانات':'No data found','error');
  const ids=[...new Set(data.map(r=>r.employee_id).filter(Boolean))];
  const {data:emps}=await sb.from('employees').select('id,first_name,last_name,employee_code').in('id',ids);
  const empMap={};
  (emps||[]).forEach(e=>empMap[e.id]=e);

  // ✅ FIX: escape CSV values properly
  const esc=v=>`"${String(v||'').replace(/"/g,'""')}"`;
  const csv='Employee,Code,Date,Check-In,Check-Out\n'+
    data.map(r=>{
      const emp=empMap[r.employee_id]||{};
      return[esc((emp.first_name||'')+' '+(emp.last_name||'')),esc(emp.employee_code||''),esc(r.attendance_date),esc(r.check_in_time||''),esc(r.check_out_time||'')].join(',');
    }).join('\n');

  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`attendance_${from}_${to}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  toast(lang==='ar'?'تم التحميل ✅':'Downloaded ✅','success');
}

// ═══ TASKS ═══
let taskEmpId=null;

async function renderHRTasks() {
  const {data:emps}=await sb.from('employees').select('id,first_name,last_name').eq('status','active').order('first_name');
  const items=emps||[];
  if(!taskEmpId&&items.length>0) taskEmpId=items[0].id;
  const {data:tasks}=await sb.from('tasks').select('*').order('created_at',{ascending:false});
  const allTasks=tasks||[];
  const empMap={};
  items.forEach(e=>empMap[e.id]=`${e.first_name} ${e.last_name}`);
  const today=nowISO();

  $('hrContent').innerHTML=`
    <div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:16px">✅ ${lang==='ar'?'التاسكات':'Tasks'}</div>
    <div class="card" style="margin-bottom:16px">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">➕ ${lang==='ar'?'تاسك جديد':'New Task'}</div>
      <div class="form-field">
        <label class="field-label">${lang==='ar'?'العنوان':'Title'}</label>
        <input class="form-input" type="text" id="task_title" placeholder="${lang==='ar'?'اسم التاسك...':'Task name...'}"/>
      </div>
      <div class="form-field">
        <label class="field-label">${lang==='ar'?'التفاصيل':'Description'}</label>
        <textarea class="form-input" id="task_desc" placeholder="${lang==='ar'?'تفاصيل اختيارية...':'Optional details...'}" style="min-height:70px"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-field" style="margin:0">
          <label class="field-label">${lang==='ar'?'الموظف':'Employee'}</label>
          <select class="form-input" id="task_emp">
            ${items.map(e=>`<option value="${e.id}">${e.first_name} ${e.last_name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field" style="margin:0">
          <label class="field-label">${lang==='ar'?'الديد لاين':'Deadline'}</label>
          <input class="form-input" type="date" id="task_deadline" min="${today}"/>
        </div>
      </div>
      <button class="primary-btn" onclick="addTask()" style="width:100%;margin-top:12px">📤 ${lang==='ar'?'إرسال التاسك':'Send Task'}</button>
    </div>
    <div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.9px">${lang==='ar'?'كل التاسكات':'All Tasks'} (${allTasks.length})</div>
    ${allTasks.length===0
      ?`<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">${lang==='ar'?'لا توجد تاسكات':'No tasks yet'}</div></div>`
      :allTasks.map(tk=>{
        const empName=empMap[tk.assigned_to]||'—';
        const isDone=tk.status==='done';
        const isLate=tk.deadline&&tk.deadline<today&&!isDone;
        return `<div class="card-sm" style="border-color:${isLate?'rgba(239,68,68,.4)':isDone?'rgba(34,197,94,.3)':''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
            <div style="flex:1">
              <div style="font-size:15px;font-weight:700;color:var(--text);text-decoration:${isDone?'line-through':''}">${tk.title}</div>
              ${tk.description?`<div style="font-size:12px;color:var(--sub);margin-top:3px">${tk.description}</div>`:''}
            </div>
            <button onclick="deleteTask('${tk.id}')" style="background:rgba(239,68,68,.12);border:none;border-radius:8px;width:30px;height:30px;cursor:pointer;color:var(--red);font-size:14px;flex-shrink:0;margin-${lang==='ar'?'right':'left'}:8px">✕</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="badge" style="background:rgba(56,189,248,.1);color:var(--sky);border:1px solid rgba(56,189,248,.2)">👤 ${empName}</span>
            ${tk.deadline?`<span class="badge" style="background:${isLate?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)'};color:${isLate?'var(--red)':'var(--amber)'};border:1px solid ${isLate?'rgba(239,68,68,.2)':'rgba(245,158,11,.2)'}">📅 ${fmtDate(tk.deadline)}${isLate?' ⚠️':''}</span>`:''}
            <span class="badge" style="background:${isDone?'rgba(34,197,94,.1)':'rgba(99,102,241,.1)'};color:${isDone?'var(--green)':'var(--indigo)'};border:1px solid ${isDone?'rgba(34,197,94,.2)':'rgba(99,102,241,.2)'}">
              ${isDone?(lang==='ar'?'✅ منتهي':'✅ Done'):(lang==='ar'?'⏳ قيد التنفيذ':'⏳ Pending')}
            </span>
          </div>
        </div>`;
      }).join('')}
  `;
}

async function addTask() {
  const title=$('task_title')?.value?.trim(), desc=$('task_desc')?.value?.trim();
  const empId=$('task_emp')?.value, deadline=$('task_deadline')?.value;
  if(!title) return toast(lang==='ar'?'أدخل عنوان التاسك':'Enter task title','error');
  if(!empId) return toast(lang==='ar'?'اختر موظفاً':'Select employee','error');
  if(!deadline) return toast(lang==='ar'?'اختر ديد لاين':'Select deadline','error');
  const {error}=await sb.from('tasks').insert([{title,description:desc,assigned_to:empId,deadline,status:'pending'}]);
  if(error) return toast(error.message,'error');
  await sb.from('notifications').insert([{
    employee_id:empId,
    title:lang==='ar'?`تاسك جديد: ${title}`:`New Task: ${title}`,
    message:`${lang==='ar'?'الديد لاين:':'Deadline:'} ${fmtDate(deadline)}${desc?' — '+desc:''}`,
    type:'reminder', is_read:false
  }]);
  toast(lang==='ar'?'تم إرسال التاسك ✅':'Task sent ✅','success');
  renderHRTasks();
}

async function deleteTask(id) {
  showConfirm({
    icon:'🗑️', title:lang==='ar'?'حذف التاسك':'Delete Task',
    msg:lang==='ar'?'هل أنت متأكد من حذف هذا التاسك؟':'Are you sure you want to delete this task?',
    okLabel:lang==='ar'?'حذف':'Delete', okColor:'var(--red)',
    onOk:async()=>{
      const {error}=await sb.from('tasks').delete().eq('id',id);
      if(error) return toast(error.message,'error');
      toast(lang==='ar'?'تم الحذف':'Deleted','success');
      renderHRTasks();
    }
  });
}

// ═══ EMPLOYEE FILES ═══
let filesEmpId=null;

async function renderHRFiles() {
  const {data:emps}=await sb.from('employees').select('id,first_name,last_name').eq('status','active').order('first_name');
  const items=emps||[];
  if(!filesEmpId&&items.length>0) filesEmpId=items[0].id;
  const {data:files}=await sb.from('employee_files').select('*').eq('employee_id',filesEmpId).order('uploaded_at',{ascending:false});
  const empFiles=files||[];

  $('hrContent').innerHTML=`
    <div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:16px">📁 ${lang==='ar'?'ملفات الموظفين':'Employee Files'}</div>
    <div class="form-field" style="margin-bottom:16px">
      <label class="field-label">${lang==='ar'?'اختر موظف':'Select Employee'}</label>
      <select class="form-input" onchange="filesEmpId=this.value;renderHRFiles()">
        ${items.map(e=>`<option value="${e.id}" ${e.id===filesEmpId?'selected':''}>${e.first_name} ${e.last_name}</option>`).join('')}
      </select>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">⬆️ ${lang==='ar'?'رفع ملف':'Upload File'}</div>
      <div style="border:2px dashed var(--border);border-radius:var(--r-lg);padding:24px;text-align:center;cursor:pointer;transition:border-color .2s" onclick="$('fileInput').click()" id="dropZone">
        <div style="font-size:36px;margin-bottom:8px">📎</div>
        <div style="font-size:14px;font-weight:600;color:var(--sub)">${lang==='ar'?'اضغط لاختيار ملف':'Click to choose file'}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">PDF, Word, Excel, Images</div>
        <input type="file" id="fileInput" style="display:none" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onchange="handleFileUpload(this)"/>
      </div>
      <div id="uploadProgress" style="display:none;margin-top:12px;text-align:center;color:var(--sub);font-size:13px">⏳ ${lang==='ar'?'جاري الرفع...':'Uploading...'}</div>
    </div>
    <div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.9px">${lang==='ar'?'الملفات':'Files'} (${empFiles.length})</div>
    ${empFiles.length===0
      ?`<div class="empty"><div class="empty-icon">📂</div><div class="empty-title">${lang==='ar'?'لا توجد ملفات':'No files yet'}</div></div>`
      :empFiles.map(f=>{
        const icon=f.file_type?.includes('pdf')?'📄':f.file_type?.includes('word')||f.file_type?.includes('doc')?'📝':f.file_type?.includes('sheet')||f.file_type?.includes('xls')?'📊':'📎';
        return `<div class="card-sm" style="display:flex;align-items:center;gap:12px">
          <div style="font-size:28px;flex-shrink:0">${icon}</div>
          <div style="flex:1;overflow:hidden">
            <div style="font-size:14px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.file_name}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${new Date(f.uploaded_at).toLocaleDateString(lang==='ar'?'ar-EG':'en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <a href="${f.file_url}" target="_blank" style="background:rgba(56,189,248,.12);border:none;border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:16px">👁</a>
            <button onclick="deleteFile('${f.id}','${encodeURIComponent(f.file_url)}')" style="background:rgba(239,68,68,.12);border:none;border-radius:8px;width:34px;height:34px;cursor:pointer;color:var(--red);font-size:14px">✕</button>
          </div>
        </div>`;
      }).join('')}
  `;
}

async function handleFileUpload(input) {
  const file=input.files[0];
  if(!file) return;
  if(file.size>10*1024*1024) return toast(lang==='ar'?'الملف أكبر من 10MB':'File exceeds 10MB','error');
  const dz=$('dropZone'), up=$('uploadProgress');
  if(up) up.style.display='block';
  if(dz) dz.style.opacity='0.5';
  try {
    const ext=file.name.split('.').pop();
    const fileName=`${filesEmpId}/${Date.now()}.${ext}`;
    const {error:upErr}=await sb.storage.from('employee-files').upload(fileName,file,{upsert:true});
    if(upErr) throw upErr;
    const {data:urlData}=sb.storage.from('employee-files').getPublicUrl(fileName);
    const {error:dbErr}=await sb.from('employee_files').insert([{employee_id:filesEmpId,file_name:file.name,file_url:urlData.publicUrl,file_type:file.type}]);
    if(dbErr) throw dbErr;
    toast(lang==='ar'?'تم رفع الملف ✅':'File uploaded ✅','success');
    await renderHRFiles();
  } catch(e) {
    toast(e.message,'error');
    if(dz) dz.style.opacity='1';
    if(up) up.style.display='none';
  }
}

// ✅ FIX: robust delete — storage failure doesn't block DB delete
async function deleteFile(id, encodedUrl) {
  const url = decodeURIComponent(encodedUrl);
  showConfirm({
    icon:'🗑️', title:lang==='ar'?'حذف الملف':'Delete File',
    msg:lang==='ar'?'هل أنت متأكد من حذف هذا الملف؟':'Are you sure you want to delete this file?',
    okLabel:lang==='ar'?'حذف':'Delete', okColor:'var(--red)',
    onOk:async()=>{
      try {
        // حذف من الـ storage (لو فشل نكمل)
        try {
          const urlObj=new URL(url);
          const parts=urlObj.pathname.split('/employee-files/');
          if(parts[1]) await sb.storage.from('employee-files').remove([decodeURIComponent(parts[1])]);
        } catch(storageErr){ console.warn('Storage delete failed:',storageErr); }

        // حذف من الـ DB دايمًا
        const {error}=await sb.from('employee_files').delete().eq('id',id);
        if(error) return toast(error.message,'error');
        toast(lang==='ar'?'تم الحذف ✅':'Deleted ✅','success');
        await renderHRFiles();
      } catch(e){ toast(e.message,'error'); }
    }
  });
}
async function deleteLeave(id, status, empId, startDate, endDate, leaveType) {
  const DEDUCTIBLE = ['annual','sick','emergency'];
  const isDeductible = status==='approved' && DEDUCTIBLE.includes(leaveType?.toLowerCase());
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1;

  showConfirm({
    icon: '🗑️',
    title: lang==='ar'?'حذف طلب الإجازة':'Delete Leave Request',
    msg: isDeductible
      ? (lang==='ar'?`هل تريد إرجاع ${days} يوم للرصيد أم الحذف بدون إرجاع؟`:`Delete and return ${days} days to balance?`)
      : (lang==='ar'?'هل أنت متأكد من الحذف؟':'Are you sure you want to delete this request?'),
    okLabel: isDeductible ? (lang==='ar'?`حذف + إرجاع ${days} يوم`:`Delete + Return ${days}d`) : (lang==='ar'?'حذف':'Delete'),
    okColor: 'var(--red)',
    onOk: async () => {
      if(isDeductible) {
        const {data:emp} = await sb.from('employees').select('leave_balance').eq('id',empId).single();
        const currentBal = emp?.leave_balance ?? 0;
        await sb.from('employees').update({leave_balance: currentBal + days}).eq('id', empId);
      }
      const {error} = await sb.from('leave_requests').delete().eq('id', id);
      if(error) return toast(error.message,'error');
      toast(lang==='ar'?'تم الحذف ✅':'Deleted ✅','success');
      renderHR('leaves');
    }
  });
}
