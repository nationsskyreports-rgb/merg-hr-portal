// ═══ SUPABASE CONFIG ═══
const sb = window.supabase.createClient(
  'https://wnuzxosjjhucxnlaptbf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudXp4b3Nqamh1Y3hubGFwdGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODY5MjgsImV4cCI6MjA4OTg2MjkyOH0.o-3ORuewx9hpgmwiJZMNNBt0LehSmutxVRsPEw-3u58'
);

function showConfirm({ icon='⚠️', title, msg, okLabel, okColor='var(--red)', onOk }) {
  $('confirmIcon').textContent   = icon;
  $('confirmTitle').textContent  = title;
  $('confirmMsg').textContent    = msg;
  $('confirmOkBtn').textContent  = okLabel;
  $('confirmOkBtn').style.background = okColor;
  $('confirmCancelBtn').textContent  = t().cancel;
  $('confirmOkBtn').onclick = () => { closeModal('confirmModal'); onOk(); };
  openModal('confirmModal');
}

// ═══ GLOBALS ═══
let lang = localStorage.getItem('lang') || 'en';
let darkMode = localStorage.getItem('dark') === '1';
let currentUser = null;
let currentEmployee = null;
let isAdmin = false;
let empTab = 'home';
let unreadCount = 0;

// ═══ TRANSLATIONS ═══
const T = {
  en: {
    welcome_back: 'Welcome Back', sign_in_sub: 'Sign in to your account',
    email: 'Email', email_lbl: 'Email',
    password: 'Password', sign_in: 'Sign In',
    enter_email: 'name@company.com', enter_pw: 'Enter your password',
    forgot_pw: 'Forgot password?', send_reset: 'Send Reset Link',
    reset_title: 'Reset Password',
    reset_sub: 'Enter your email to receive a reset link.',
    reset_sent: 'Link Sent', reset_sent_msg: 'Check your email for the reset link.',
    good_morning: 'Good Morning', good_afternoon: 'Good Afternoon', good_evening: 'Good Evening',
    check_in: 'Check In', check_out: 'Check Out', clocked_in: 'Clocked In',
    todays_att: "Today's Attendance", active: 'Active', quick_actions: 'Quick Actions',
    location: 'Location', history: 'History', leave: 'Leave', change_pw: 'Password',
    hr_panel: 'HR Panel', logout: 'Logout', profile: 'Profile',
    attendance_history: 'Attendance History',
    no_records: 'No Records', no_records_sub: 'Your attendance will appear here after your first check-in.',
    complete: 'Complete', in_progress: 'In Progress', missing: 'Missing',
    check_in_label: 'In', check_out_label: 'Out',
    leave_request: 'Leave Request', new_request: 'New Request', my_leaves: 'My Leaves',
    leave_type: 'Leave Type', start_date: 'Start Date', end_date: 'End Date',
    reason: 'Reason', describe_reason: 'Describe your reason...',
    submit: 'Submit Request', submit_request: 'Submit Request',
    day: 'Day', days: 'Days',
    invalid_dates: 'End date must be after start date.',
    missing_dates: 'Please select start and end dates.',
    missing_reason: 'Please provide a reason.',
    past_date: 'Start date cannot be in the past.',
    no_leaves: 'No Leave Requests', no_leaves_sub: "You haven't submitted any leave requests yet.",
    notifications: 'Notifications', mark_all: 'Mark All Read', mark_all_read: 'Mark All Read',
    no_notifs: 'No Notifications', no_notifs_sub: "You're all caught up.",
    my_profile: 'My Profile', total_days: 'Total Days', this_month: 'This Month',
    on_time: 'On Time', phone: 'Phone', phone_lbl: 'Phone',
    position: 'Position', department: 'Department', joined: 'Joined',
    dark_mode: 'Dark Mode', light_mode: 'Light Mode', change_password: 'Change Password',
    recent_leaves: 'Recent Leave Requests',
    current_pw: 'Current Password', new_pw: 'New Password', confirm_pw: 'Confirm New Password',
    update_pw: 'Update Password',
    weak_pw: 'Password must be at least 6 characters.',
    pw_hint: 'Password must be at least 6 characters.',
    mismatch: 'Passwords do not match.', pw_success: 'Password changed successfully.',
    hr_dashboard: 'HR Dashboard', overview: 'Overview',
    attendance: 'Attendance', attendance_tab: 'Attendance',
    leaves: 'Leaves', leaves_tab: 'Leaves',
    employees: 'Employees', employees_tab: 'Employees',
    send_notif: 'Send Notification', notifs_tab: 'Notifications',
    export: 'Export', export_tab: 'Export',
    total_emp: 'Total Employees', total_employees: 'Total Employees',
    present: 'Present', absent: 'Absent', pending_leaves: 'Pending Leaves',
    add_employee: 'Add Employee', search_emp: 'Search by name or code...',
    active_st: 'Active', inactive_st: 'Inactive',
    approve: 'Approve', reject: 'Reject',
    announcement: 'Announcement', reminder: 'Reminder', alert: 'Alert',
    notif_text: 'Notification Text', write_text: 'Write your message...',
    send_all: 'Send to All', will_send_to: 'Will be sent to', employee_word: 'employees',
    generate: 'Generate & Download', generate_download: 'Generate & Download',
    from_date: 'From Date', to_date: 'To Date',
    loading: 'Loading...', back: 'Back', not_available: 'Not Available',
    out_of_range: 'Out of Range',
    you_are: 'You are', from_office: 'from the office. Max allowed',
    loc_error: 'Location Error',
    enable_gps: 'Could not get your location. Please enable GPS and try again.',
    perm_denied: 'Location permission denied.', loc_perm_denied: 'Location permission denied.',
    already_in: 'Already Checked In', already_out: 'Already Checked Out',
    not_in: 'Not Checked In', not_checked_in: 'Not Checked In',
    checked_in: 'Checked In ✅', checked_out: 'Checked Out 👋',
    time_lbl: 'Time', distance: 'Distance', offline: 'No Internet Connection.',
    days_lbl: 'days', day_lbl: 'day', records: 'records', under_review: 'Under Review',
    pending_confirm: 'Pending Confirmation', confirm_mobile: 'Confirm Mobile Check-in',
    confirm_success: 'Check-in confirmed successfully!',
    cancel: 'Cancel', logout_confirm: 'Confirm Logout',
    logout_msg: 'Are you sure you want to sign out?', sign_out: 'Sign Out',
    no_att_today: 'No attendance recorded today.',
    my_tasks: 'My Tasks', no_tasks: 'No tasks assigned',
  },
  ar: {
    welcome_back: 'مرحباً بعودتك', sign_in_sub: 'سجّل الدخول إلى حسابك',
    email: 'البريد الإلكتروني', email_lbl: 'البريد',
    password: 'كلمة المرور', sign_in: 'تسجيل الدخول',
    enter_email: 'name@company.com', enter_pw: 'أدخل كلمة المرور',
    forgot_pw: 'نسيت كلمة المرور؟', send_reset: 'إرسال رابط الاستعادة',
    reset_title: 'إعادة تعيين كلمة المرور',
    reset_sub: 'أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين.',
    reset_sent: 'تم إرسال الرابط', reset_sent_msg: 'تحقق من بريدك الإلكتروني لرابط إعادة التعيين.',
    good_morning: 'صباح الخير', good_afternoon: 'مساء الخير', good_evening: 'مساء الخير',
    check_in: 'تسجيل دخول', check_out: 'تسجيل خروج', clocked_in: 'مسجّل دخول حالياً',
    todays_att: 'حضور اليوم', active: 'نشط', quick_actions: 'إجراءات سريعة',
    location: 'الموقع', history: 'السجل', leave: 'إجازة', change_pw: 'كلمة المرور',
    hr_panel: 'لوحة التحكم', logout: 'تسجيل خروج', profile: 'الملف الشخصي',
    attendance_history: 'سجل الحضور',
    no_records: 'لا توجد سجلات', no_records_sub: 'سيظهر سجل حضورك هنا بعد أول تسجيل دخول.',
    complete: 'مكتمل', in_progress: 'قيد العمل', missing: 'مفقود',
    check_in_label: 'دخول', check_out_label: 'خروج',
    leave_request: 'طلب إجازة', new_request: 'طلب جديد', my_leaves: 'إجازاتي',
    leave_type: 'نوع الإجازة', start_date: 'تاريخ البداية', end_date: 'تاريخ النهاية',
    reason: 'السبب', describe_reason: 'اكتب السبب هنا...',
    submit: 'إرسال الطلب', submit_request: 'إرسال الطلب',
    day: 'يوم', days: 'أيام',
    invalid_dates: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية.',
    missing_dates: 'الرجاء اختيار تاريخ البداية والنهاية.',
    missing_reason: 'الرجاء كتابة السبب.',
    past_date: 'لا يمكن اختيار تاريخ في الماضي.',
    no_leaves: 'لا توجد طلبات إجازة', no_leaves_sub: 'لم تقدم أي طلبات إجازة بعد.',
    notifications: 'الإشعارات', mark_all: 'قراءة الكل', mark_all_read: 'قراءة الكل',
    no_notifs: 'لا توجد إشعارات', no_notifs_sub: 'ليس لديك إشعارات جديدة.',
    my_profile: 'ملفي الشخصي', total_days: 'إجمالي الأيام', this_month: 'هذا الشهر',
    on_time: 'في الوقت', phone: 'الهاتف', phone_lbl: 'الهاتف',
    position: 'المنصب', department: 'القسم', joined: 'تاريخ الانضمام',
    dark_mode: 'الوضع الداكن', light_mode: 'الوضع الفاتح',
    change_password: 'تغيير كلمة المرور', recent_leaves: 'طلبات الإجازة الأخيرة',
    current_pw: 'كلمة المرور الحالية', new_pw: 'كلمة المرور الجديدة', confirm_pw: 'تأكيد كلمة المرور',
    update_pw: 'تحديث كلمة المرور',
    weak_pw: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    pw_hint: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
    mismatch: 'كلمات المرور غير متطابقة.', pw_success: 'تم تغيير كلمة المرور بنجاح.',
    hr_dashboard: 'لوحة التحكم', overview: 'نظرة عامة',
    attendance: 'الحضور', attendance_tab: 'الحضور',
    leaves: 'الإجازات', leaves_tab: 'الإجازات',
    employees: 'الموظفين', employees_tab: 'الموظفين',
    send_notif: 'إرسال إشعار', notifs_tab: 'إشعارات',
    export: 'تصدير', export_tab: 'تصدير',
    total_emp: 'إجمالي الموظفين', total_employees: 'إجمالي الموظفين',
    present: 'حاضر', absent: 'غائب', pending_leaves: 'طلبات معلقة',
    add_employee: 'إضافة موظف', search_emp: 'ابحث بالاسم أو الكود...',
    active_st: 'نشط', inactive_st: 'غير نشط',
    approve: 'موافقة', reject: 'رفض',
    announcement: 'إعلان', reminder: 'تذكير', alert: 'تنبيه',
    notif_text: 'نص الإشعار', write_text: 'اكتب رسالتك...',
    send_all: 'إرسال للجميع', will_send_to: 'سيتم الإرسال إلى', employee_word: 'موظف',
    generate: 'إنشاء وتحميل', generate_download: 'إنشاء وتحميل',
    from_date: 'من تاريخ', to_date: 'إلى تاريخ',
    loading: 'جاري التحميل...', back: 'رجوع', not_available: 'غير متاح',
    out_of_range: 'خارج النطاق',
    you_are: 'أنت على بعد', from_office: 'من المكتب. الحد المسموح',
    loc_error: 'خطأ في الموقع',
    enable_gps: 'تعذّر تحديد موقعك. تأكد من تفعيل GPS وحاول مرة أخرى.',
    perm_denied: 'تم رفض إذن الموقع.', loc_perm_denied: 'تم رفض إذن الموقع. فعّله من الإعدادات.',
    already_in: 'مسجّل دخول بالفعل', already_out: 'مسجّل خروج بالفعل',
    not_in: 'لم تسجّل دخول', not_checked_in: 'لم تسجّل دخول',
    checked_in: 'تم تسجيل الدخول ✅', checked_out: 'تم تسجيل الخروج 👋',
    time_lbl: 'الوقت', distance: 'المسافة', offline: 'لا يوجد اتصال بالإنترنت.',
    days_lbl: 'أيام', day_lbl: 'يوم', records: 'سجلات', under_review: 'قيد المراجعة',
    pending_confirm: 'بانتظار التأكيد', confirm_mobile: 'تأكيد دخول الموبايل',
    confirm_success: 'تم تأكيد الحضور بنجاح!',
    cancel: 'إلغاء', logout_confirm: 'تأكيد تسجيل الخروج',
    logout_msg: 'هل أنت متأكد من تسجيل الخروج؟', sign_out: 'تسجيل الخروج',
    no_att_today: 'لا يوجد حضور مسجل اليوم.',
    my_tasks: 'تاسكاتي', no_tasks: 'مفيش تاسكات عليك',
  }
};
const t = () => T[lang];

// ═══ UTILS ═══
const $ = id => document.getElementById(id);
const nowISO = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().split(' ')[0];
const fmtTime = v => v ? v.slice(0,5) : '—';
const fmtDate = d => {
  if(!d) return '';
  const dt = new Date(d+'T00:00:00');
  return dt.toLocaleDateString(lang==='ar'?'ar-EG':'en-US',{month:'short',day:'numeric',year:'numeric'});
};
const haversine = (a,b,c,d) => {
  const R=6371000,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b);
  return R*2*Math.atan2(
    Math.sqrt(Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2),
    Math.sqrt(1-(Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2))
  );
};
const getGreeting = () => {
  const h = new Date().getHours();
  return h<12 ? t().good_morning : h<17 ? t().good_afternoon : t().good_evening;
};
const statusColor = s => s==='approved'?'#22C55E':s==='rejected'?'#EF4444':'#F59E0B';

function toast(msg, type='') {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'show' + (type ? ' '+type : '');
  setTimeout(()=>el.className='', 3000);
}

function togglePw(id, btn) {
  const inp = $(id);
  if(!inp) return;
  inp.type = inp.type==='password'?'text':'password';
  btn.textContent = inp.type==='password'?'👁':'🙈';
}

function applyDark() {
  document.body.classList.toggle('dark', darkMode);
  localStorage.setItem('dark', darkMode?'1':'0');
}

function toggleLang() {
  lang = lang==='en'?'ar':'en';
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang==='ar'?'rtl':'ltr';
  updateLangBtns();
  if(currentUser) {
    if(isAdmin) renderHR(hrTab);
    else initEmp();
  } else {
    renderLogin();
  }
}

function updateLangBtns() {
  const label = lang==='en'?'عربي':'EN';
  ['langBtnTxt','appLangBtn','hrLangBtn'].forEach(id => {
    const el = $(id);
    if(el) { el.textContent = label; el.style.color='var(--green)'; }
  });
}

function updateStaticText() {
  const el = id => $(id);
  if(el('fm_title'))     el('fm_title').textContent     = t().reset_title;
  if(el('fm_sub'))       el('fm_sub').textContent       = t().reset_sub;
  if(el('fm_label'))     el('fm_label').textContent     = t().email_lbl;
  if(el('resetBtnTxt')) el('resetBtnTxt').textContent   = t().send_reset;
  if(el('cpTitle'))      el('cpTitle').textContent      = t().change_password;
  if(el('cpBtn'))        el('cpBtn').textContent        = t().update_pw;
  if(el('addEmpTitle'))  el('addEmpTitle').textContent  = t().add_employee;
  if(el('addEmpBtnTxt')) el('addEmpBtnTxt').textContent = t().add_employee;
}

function showScreen(screen) {
  $('root').style.display    = screen==='login'  ?'flex'  :'none';
  $('empApp').style.display  = screen==='empApp' ?'block' :'none';
  $('hrApp').style.display   = screen==='hrApp'  ?'block' :'none';
}

function openModal(id)  { const m=$(id); if(m) m.style.display='flex'; }
function closeModal(id) { const m=$(id); if(m) m.style.display='none'; }

// ═══ LOGIN ═══
function renderLogin() {
  $('root').innerHTML = `
    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px">
      <div style="width:100%;max-width:380px">
        <div style="text-align:center;margin-bottom:36px">
          <div style="font-size:36px;font-weight:900;color:var(--indigo);font-family:'Syne',sans-serif;letter-spacing:-1px;margin-bottom:8px">MERGE</div>
          <div style="font-size:22px;font-weight:800;color:var(--text);font-family:'Syne',sans-serif;margin-bottom:6px">${t().welcome_back}</div>
          <div style="font-size:14px;color:var(--muted)">${t().sign_in_sub}</div>
        </div>
        <div class="form-field">
          <label class="field-label">${t().email}</label>
          <input class="form-input" type="email" id="li_email" placeholder="${t().enter_email}"/>
        </div>
        <div class="form-field">
          <label class="field-label">${t().password}</label>
          <div style="display:flex;gap:8px">
            <input class="form-input" type="password" id="li_pw" placeholder="${t().enter_pw}" style="flex:1"/>
            <button onclick="togglePw('li_pw',this)" style="background:var(--input-bg);border:1.5px solid var(--border);border-radius:var(--r-md);width:44px;cursor:pointer;font-size:16px">👁</button>
          </div>
        </div>
        <button class="primary-btn" onclick="handleLogin()" style="width:100%;margin-bottom:10px;padding:14px">${t().sign_in}</button>
        <button class="primary-btn" style="width:100%;background:var(--surface-3);color:var(--sub);box-shadow:none;border:1px solid var(--border)" onclick="openModal('forgotPwModal')">${t().forgot_pw}</button>
        <div style="text-align:center;margin-top:24px;display:flex;align-items:center;justify-content:center;gap:16px">
          <button onclick="toggleLang()" style="background:none;border:none;color:var(--green);cursor:pointer;font-weight:700;font-size:14px">${lang==='en'?'عربي':'EN'}</button>
          <div style="width:1px;height:16px;background:var(--border)"></div>
          <button onclick="toggleDark()" style="background:none;border:none;color:var(--sub);cursor:pointer;font-size:18px">${darkMode?'☀️':'🌙'}</button>
        </div>
      </div>
    </div>
  `;
  showScreen('login');
}

async function handleLogin() {
  const email = $('li_email')?.value?.trim();
  const pw    = $('li_pw')?.value;
  if(!email||!pw) return toast('Enter email and password','error');
  try {
    const {data,error} = await sb.auth.signInWithPassword({email,password:pw});
    if(error) return toast(error.message,'error');
    currentUser = data.user;
    const {data:emp} = await sb.from('employees').select('*').eq('email',email).single();
    if(!emp) return toast('Employee not found','error');
    currentEmployee = emp;
    isAdmin = emp.email==='admin@merge.com';
    if(isAdmin) { showScreen('hrApp'); initHR(); }
    else { showScreen('empApp'); initEmp(); fetchUnread(); startRealtimeNotifs(); }
  } catch(e) { toast(e.message,'error'); }
}

async function handleForgotPw() {
  const email = $('fm_email')?.value?.trim();
  if(!email) return toast('Enter your email','error');
  try {
    const {error} = await sb.auth.resetPasswordForEmail(email);
    if(error) return toast(error.message,'error');
    toast(t().reset_sent_msg,'success');
    closeModal('forgotPwModal');
  } catch(e) { toast(e.message,'error'); }
}

async function handleChangePw() {
  const nw  = $('cp_new')?.value;
  const cnf = $('cp_confirm')?.value;
  if(!nw||!cnf) return toast('Enter new password','error');
  if(nw.length<6) return toast(t().pw_hint,'error');
  if(nw!==cnf)   return toast(t().mismatch,'error');
  try {
    const {error} = await sb.auth.updateUser({password:nw});
    if(error) return toast(error.message,'error');
    toast(t().pw_success,'success');
    closeModal('changePwModal');
  } catch(e) { toast(e.message,'error'); }
}

function handleLogout() {
  showConfirm({
    icon:'🚪', title:t().logout_confirm, msg:t().logout_msg,
    okLabel:t().sign_out, okColor:'var(--red)',
    onOk:() => {
      sb.auth.signOut();
      currentUser=null; currentEmployee=null; isAdmin=false;
      renderLogin();
    }
  });
}

function toggleDark() {
  darkMode=!darkMode; applyDark();
  if(currentUser && !isAdmin) renderEmp(empTab);
  else if(!currentUser) renderLogin();
}

// ═══════════════════════════════════════════
// EMPLOYEE APP — Full Redesign (Manus style)
// ═══════════════════════════════════════════

// SVG icons for bottom nav
const navIcons = {
  home: `<svg viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/><path d="M3 12v9h18v-9"/></svg>`,
  history: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  leave: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  tasks: `<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  notifs: `<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  profile: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
};

async function initEmp() {
  updateLangBtns();
  updateStaticText();
  applyDark();

  $('empApp').innerHTML = `
    <!-- Header -->
    <div class="emp-header">
      <div style="font-size:20px;font-weight:900;color:var(--indigo);font-family:'Syne',sans-serif;letter-spacing:-0.5px">MERGE</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button onclick="toggleLang()" id="appLangBtn"
          style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:var(--r-full);padding:5px 12px;cursor:pointer;font-size:12px;font-weight:800;color:var(--green);font-family:'Syne',sans-serif">
          ${lang==='en'?'عربي':'EN'}
        </button>
        <button onclick="handleLogout()"
          style="background:var(--red-dim);border:1px solid rgba(239,68,68,.2);border-radius:var(--r-full);padding:5px 10px;cursor:pointer;font-size:12px;font-weight:700;color:var(--red)">
          🚪
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="emp-content" id="empContent"></div>

    <!-- Bottom Nav -->
    <nav class="bottom-nav" id="bottomNav">
      <button class="nav-item active" id="nav-home" onclick="showEmpTab('home',this)">
        ${navIcons.home}
        <span class="nav-label">${lang==='ar'?'الرئيسية':'Home'}</span>
      </button>
      <button class="nav-item" id="nav-history" onclick="showEmpTab('history',this)">
        ${navIcons.history}
        <span class="nav-label">${t().history}</span>
      </button>
      <button class="nav-item" id="nav-leave" onclick="showEmpTab('leave',this)">
        ${navIcons.leave}
        <span class="nav-label">${t().leave}</span>
      </button>
      <button class="nav-item" id="nav-tasks" onclick="showEmpTab('tasks',this)">
        ${navIcons.tasks}
        <span class="nav-label">${lang==='ar'?'تاسكاتي':'Tasks'}</span>
      </button>
      <button class="nav-item" id="nav-notifs" onclick="showEmpTab('notifs',this)" style="position:relative">
        ${navIcons.notifs}
        <span class="nav-label">${t().notifications}</span>
        <span id="notifBadge" class="nav-badge"></span>
      </button>
      <button class="nav-item" id="nav-profile" onclick="showEmpTab('profile',this)">
        ${navIcons.profile}
        <span class="nav-label">${t().profile}</span>
      </button>
    </nav>
  `;

  // ═══ LOAD CUSTOM PAGES INTO NAV ═══
  const {data:customPages} = await sb.from('custom_pages').select('id,title,slug').order('title');
  if(customPages && customPages.length > 0) {
    const navContainer = $('bottomNav');
    customPages.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'nav-item';
      btn.onclick = function() { showEmpTab(p.slug, this); };
btn.id = 'nav-' + p.slug;
btn.innerHTML = `
    <span style="font-size:22px">📄</span>
    <span class="nav-label">${p.title}</span>
  `;
      navContainer.appendChild(btn);
    });
  }

  renderEmp('home');
  fetchUnread();
}

function showEmpTab(tab, el) {
  empTab = tab;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if(el) el.classList.add('active');
  else { const nb = $('nav-'+tab); if(nb) nb.classList.add('active'); }
  renderEmp(tab);
}

async function renderEmp(tab) {
  const el = $('empContent');
  if(!el) return;
  if(tab==='home')    await renderHome();
  else if(tab==='history') await renderHistory();
  else if(tab==='leave')   await renderLeave();
  else if(tab==='notifs')  await renderNotifs();
  else if(tab==='tasks')   await renderEmpTasks();
  else if(tab==='profile') await renderProfile();
  else {
    // ═══ RENDER CUSTOM PAGE ═══
    await renderCustomPage(tab);
  }
}

// ═══ HOME ═══
async function renderHome() {
  const emp = currentEmployee;
  const initials = (emp.first_name?.[0]||'')+(emp.last_name?.[0]||'');
  const {data:rec} = await sb.from('attendance_records').select('*').eq('employee_id',emp.id).eq('attendance_date',nowISO()).maybeSingle();
  const isClockedIn  = !!(rec && rec.check_in_time && !rec.check_out_time);
  const needsConfirm = rec?.is_mobile && !rec?.is_confirmed;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const now = new Date();
  const timeStr = now.toLocaleTimeString(lang==='ar'?'ar-EG':'en-US',{hour:'2-digit',minute:'2-digit'});
  const dateStr = now.toLocaleDateString(lang==='ar'?'ar-EG':'en-US',{weekday:'long',month:'long',day:'numeric'});

  $('empContent').innerHTML = `
    <!-- Hero Card -->
    <div class="hero-card">
      <div class="hero-greeting">${getGreeting()} 👋</div>
      <div class="hero-name">${emp.first_name} ${emp.last_name}</div>
      <div class="hero-role">${emp.job_title||''} · ${emp.department||''}</div>
      <div class="hero-time-row">
        <div class="hero-time-box">
          <div class="hero-time-label">${lang==='ar'?'الوقت':'Time'}</div>
          <div class="hero-time-val">${timeStr}</div>
        </div>
        <div class="hero-time-box">
          <div class="hero-time-label">${lang==='ar'?'التاريخ':'Date'}</div>
          <div class="hero-time-val" style="font-size:13px;padding-top:2px">${dateStr}</div>
        </div>
      </div>
    </div>

    <!-- Status + Attendance -->
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="font-size:15px;font-weight:700;color:var(--text);font-family:'Syne',sans-serif">${lang==='ar'?'الحضور اليوم':'Today\'s Attendance'}</div>
        <div class="status-pill ${needsConfirm?'pending':isClockedIn?'active':'inactive'}">
          <span class="status-dot ${isClockedIn&&!needsConfirm?'pulse':''}"></span>
          ${needsConfirm?t().pending_confirm:isClockedIn?t().clocked_in:t().todays_att}
        </div>
      </div>

      ${rec?.check_in_time ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:var(--r-lg);padding:12px;text-align:center">
            <div style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">${t().check_in_label}</div>
            <div style="font-size:20px;font-weight:800;color:var(--green);font-family:'Syne',sans-serif">${fmtTime(rec.check_in_time)}</div>
          </div>
          <div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:var(--r-lg);padding:12px;text-align:center">
            <div style="font-size:10px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">${t().check_out_label}</div>
            <div style="font-size:20px;font-weight:800;color:${rec.check_out_time?'var(--red)':'var(--muted)'};font-family:'Syne',sans-serif">${fmtTime(rec.check_out_time)}</div>
          </div>
        </div>
      ` : ''}

      ${needsConfirm && !isMobile ? `
        <button class="primary-btn" style="width:100%;margin-bottom:10px;background:var(--amber)" onclick="confirmCheckIn('${rec.id}')">
          💻 ${t().confirm_mobile}
        </button>
      ` : ''}

      <div class="att-btns">
        <button class="att-btn checkin" onclick="handleCheckIn()"
          ${isClockedIn||(needsConfirm&&isMobile)?'disabled':''} id="ciBtn">
          <span class="att-btn-icon">✅</span>
          ${t().check_in}
        </button>
        <button class="att-btn checkout" onclick="handleCheckOut()"
          ${!isClockedIn||needsConfirm?'disabled':''} id="coBtn">
          <span class="att-btn-icon">🚪</span>
          ${t().check_out}
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.9px;font-family:'Syne',sans-serif">${t().quick_actions}</div>
    <div class="action-grid">
      <button class="action-card" onclick="showEmpTab('history')">
        <div class="ac-icon" style="background:rgba(16,185,129,.1)">📊</div>
        <div class="ac-label" style="color:var(--green)">${t().history}</div>
      </button>
      <button class="action-card" onclick="showEmpTab('leave')">
        <div class="ac-icon" style="background:rgba(168,85,247,.1)">🌴</div>
        <div class="ac-label" style="color:var(--purple)">${t().leave}</div>
      </button>
      <button class="action-card" onclick="showEmpTab('tasks')">
        <div class="ac-icon" style="background:rgba(14,165,233,.1)">✅</div>
        <div class="ac-label" style="color:var(--sky)">${lang==='ar'?'تاسكاتي':'Tasks'}</div>
      </button>
      <button class="action-card" onclick="showEmpTab('notifs')">
        <div class="ac-icon" style="background:rgba(99,102,241,.1)">🔔</div>
        <div class="ac-label" style="color:var(--indigo)">${t().notifications}</div>
      </button>
      <button class="action-card" onclick="openModal('changePwModal')">
        <div class="ac-icon" style="background:rgba(245,158,11,.1)">🔐</div>
        <div class="ac-label" style="color:var(--amber)">${t().change_pw}</div>
      </button>
      <button class="action-card" onclick="showEmpTab('profile')">
        <div class="ac-icon" style="background:rgba(90,100,120,.1)">👤</div>
        <div class="ac-label" style="color:var(--sub)">${t().profile}</div>
      </button>
    </div>
  `;
}

// ═══ CHECK IN / OUT (unchanged logic) ═══
async function handleCheckIn() {
  const btn = $('ciBtn'); if(btn) btn.disabled=true;
  try {
    if(!navigator.onLine) return toast(t().offline,'error');
    const {data:office} = await sb.from('office_location').select('*').eq('is_active',true).single();
    if(!office) return toast('Office location not configured','error');
    const loc = await new Promise((res,rej)=>{
      if(!navigator.geolocation) return rej(new Error('unavailable'));
      navigator.geolocation.getCurrentPosition(
        p=>res({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy||50}),
        ()=>rej(new Error(t().enable_gps)),
        {enableHighAccuracy:true,timeout:10000,maximumAge:60000}
      );
    });
    const dist    = haversine(loc.lat,loc.lng,office.latitude,office.longitude);
    const allowed = office.radius_meters + Math.min(loc.acc,50);
    if(dist>allowed) return toast(`${t().out_of_range}: ${dist.toFixed(0)}m. Max: ${office.radius_meters}m`,'error');
    const {data:ex} = await sb.from('attendance_records').select('*').eq('employee_id',currentEmployee.id).eq('attendance_date',nowISO()).maybeSingle();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if(ex) {
      const {error} = await sb.from('attendance_records').update({check_in_time:nowTime(),check_out_time:null,is_mobile:isMobile,is_confirmed:!isMobile}).eq('id',ex.id);
      if(error) return toast(error.message,'error');
    } else {
      const {error} = await sb.from('attendance_records').insert([{employee_id:currentEmployee.id,attendance_date:nowISO(),check_in_time:nowTime(),office_id:office.id,is_mobile:isMobile,is_confirmed:!isMobile}]);
      if(error) return toast(error.message,'error');
    }
    if(isMobile) toast(lang==='ar'?'تم تسجيل الدخول من الموبايل. يرجى التأكيد من الويب.':'Checked in from mobile. Please confirm from web.','warning');
    else toast(`${t().checked_in} ${t().time_lbl}: ${fmtTime(nowTime())}. ${t().distance}: ${dist.toFixed(0)}m`,'success');
    renderEmp('home');
  } catch(e) { toast(e.message,'error'); if(btn) btn.disabled=false; }
}

async function confirmCheckIn(id) {
  if(!id) return toast('Invalid Record ID','error');
  const btn = event.currentTarget; if(btn) btn.disabled=true;
  try {
    const {error} = await sb.from('attendance_records').update({is_confirmed:true}).eq('id',id);
    if(error) throw error;
    toast(t().confirm_success,'success');
    renderEmp('home');
  } catch(e) { toast(e.message,'error'); if(btn) btn.disabled=false; }
}

async function handleCheckOut() {
  const btn = $('coBtn'); if(btn) btn.disabled=true;
  try {
    if(!navigator.onLine) return toast(t().offline,'error');
    const {data:rec} = await sb.from('attendance_records').select('*').eq('employee_id',currentEmployee.id).eq('attendance_date',nowISO()).maybeSingle();
    if(!rec) return toast(t().not_in,'error');
    if(rec.check_out_time) return toast(t().already_out,'error');
    const time = nowTime();
    const {error} = await sb.from('attendance_records').update({check_out_time:time}).eq('id',rec.id);
    if(error) return toast(error.message,'error');
    toast(`${t().checked_out} ${t().time_lbl}: ${fmtTime(time)}`,'success');
    renderEmp('home');
  } catch(e) { toast(e.message,'error'); if(btn) btn.disabled=false; }
}

// ═══ HISTORY ═══
async function renderHistory() {
  const {data:recs} = await sb.from('attendance_records').select('*').eq('employee_id',currentEmployee.id).order('attendance_date',{ascending:false}).limit(60);
  const records = recs||[];

  // ← هنا برة الـ map
  const {data:shiftSetting} = await sb.from('app_settings').select('value').eq('key','shift_start_time').single();
  const shiftStart = (shiftSetting?.value || '09:15') + ':00';

  $('empContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:18px;font-weight:800;color:var(--text);font-family:'Syne',sans-serif">${t().attendance_history}</div>
      <span class="badge" style="background:var(--sky-dim);color:var(--sky);border:1px solid rgba(14,165,233,.2)">${records.length} ${t().records}</span>
    </div>
    ${records.length===0
      ?`<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">${t().no_records}</div><div class="empty-sub">${t().no_records_sub}</div></div>`
      :records.map(r=>{
        const ok   = r.check_in_time&&r.check_out_time;
        const late = r.check_in_time && r.check_in_time > shiftStart;
        const badge = ok
          ?`<span class="badge" style="background:var(--green-dim);color:var(--green);border:1px solid rgba(16,185,129,.2)">${t().complete}</span>`
          :r.check_in_time
            ?`<span class="badge" style="background:var(--amber-dim);color:var(--amber);border:1px solid rgba(245,158,11,.2)">${t().in_progress}</span>`
            :`<span class="badge" style="background:var(--red-dim);color:var(--red);border:1px solid rgba(239,68,68,.2)">${t().missing}</span>`;
        return `<div class="hist-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <span style="font-size:14px;font-weight:700;color:var(--text)">${fmtDate(r.attendance_date)}</span>${badge}
          </div>
          <div class="hist-times">
            <div>
              <div class="hist-time-label">${t().check_in_label}</div>
              <div class="hist-time-val" style="color:${late?'var(--red)':'var(--text)'}">${fmtTime(r.check_in_time)}</div>
            </div>
            <div class="hist-divider"></div>
            <div>
              <div class="hist-time-label">${t().check_out_label}</div>
              <div class="hist-time-val">${fmtTime(r.check_out_time)}</div>
            </div>
          </div>
        </div>`;
      }).join('')}
  `;
}
// ═══ LEAVE ═══
let leaveTab='new', leaveType='annual';
const DEDUCTIBLE_TYPES = ['annual','sick','emergency'];
function calcLeaveDays(start,end) { return Math.ceil((new Date(end)-new Date(start))/86400000)+1; }

async function renderLeave() {
  const [leavesRes,empRes] = await Promise.all([
    sb.from('leave_requests').select('*').eq('employee_id',currentEmployee.id).order('created_at',{ascending:false}).limit(50),
    sb.from('employees').select('leave_balance').eq('id',currentEmployee.id).single()
  ]);
  const leaves    = leavesRes.data||[];
  const balance   = empRes.data?.leave_balance??21;
  const TOTAL     = 21;
  const usedDays  = leaves.filter(lv=>lv.status==='approved'&&DEDUCTIBLE_TYPES.includes(lv.leave_type?.toLowerCase())).reduce((sum,lv)=>sum+calcLeaveDays(lv.start_date,lv.end_date),0);
  const remaining = balance;
  const pct       = Math.min(100,Math.round((usedDays/TOTAL)*100));
  const barColor  = remaining<=5?'var(--red)':remaining<=10?'var(--amber)':'var(--green)';

  const types = [
    {val:'annual',    label:lang==='ar'?'سنوية 🌴':'Annual 🌴'},
    {val:'sick',      label:lang==='ar'?'مرضية 🤒':'Sick 🤒'},
    {val:'emergency', label:lang==='ar'?'عارضة 🚨':'Emergency 🚨'},
    {val:'unpaid',    label:lang==='ar'?'بدون راتب 💸':'Unpaid 💸'},
  ];

  $('empContent').innerHTML = `
    <div style="font-size:18px;font-weight:800;color:var(--text);font-family:'Syne',sans-serif;margin-bottom:14px">${t().leave_request}</div>

    <div class="card" style="background:linear-gradient(135deg,rgba(99,102,241,.07),rgba(16,185,129,.05));border-color:rgba(99,102,241,.15);margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">${lang==='ar'?'رصيد الإجازات':'Leave Balance'}</div>
          <div style="font-size:34px;font-weight:800;color:${barColor};font-family:'Syne',sans-serif;line-height:1">${remaining}</div>
          <div style="font-size:12px;color:var(--sub);margin-top:4px">${lang==='ar'?`من أصل ${TOTAL} يوم`:`of ${TOTAL} days`}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">${lang==='ar'?'مستخدم':'Used'}</div>
          <div style="font-size:28px;font-weight:800;color:var(--sub);font-family:'Syne',sans-serif;line-height:1">${usedDays}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">${lang==='ar'?'يوم':'days'}</div>
        </div>
      </div>
      <div style="background:var(--surface-3);border-radius:99px;height:6px;overflow:hidden">
        <div style="background:${barColor};height:100%;width:${pct}%;border-radius:99px;transition:width .5s ease"></div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px;text-align:right">${pct}% ${lang==='ar'?'مستخدم':'used'}</div>
    </div>

    <div class="tab-bar">
      <button class="tab-btn ${leaveTab==='new'?'active':''}" onclick="setLeaveTab('new')">📝 ${t().new_request}</button>
      <button class="tab-btn ${leaveTab==='history'?'active':''}" onclick="setLeaveTab('history')">📋 ${t().my_leaves}</button>
    </div>

    ${leaveTab==='new'?`
      <div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.9px;font-family:'Syne',sans-serif">${t().leave_type}</div>
      <div class="chip-row">${types.map(tp=>`<button class="chip ${leaveType===tp.val?'active':''}" onclick="setLeaveType('${tp.val}')">${tp.label}</button>`).join('')}</div>
      ${!DEDUCTIBLE_TYPES.includes(leaveType)?`<div style="font-size:12px;color:var(--amber);background:var(--amber-dim);border:1px solid rgba(245,158,11,.2);border-radius:var(--r-md);padding:8px 12px;margin-bottom:12px">⚠️ ${lang==='ar'?'هذا النوع لا يُخصم من رصيدك':'This type does not affect your balance'}</div>`:''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div class="form-field"><label class="field-label">${t().start_date}</label><input class="form-input" type="date" id="lv_start" onclick="try{this.showPicker()}catch(e){}" onchange="updateDays()"/></div>
        <div class="form-field"><label class="field-label">${t().end_date}</label><input class="form-input" type="date" id="lv_end" onclick="try{this.showPicker()}catch(e){}" onchange="updateDays()"/></div>
      </div>
      <div id="daysPill"></div>
      <div class="form-field"><label class="field-label">${t().reason}</label><textarea class="form-input" id="lv_reason" placeholder="${t().describe_reason}" style="min-height:80px"></textarea></div>
      <button class="primary-btn" onclick="submitLeave()" style="width:100%;padding:14px">📤 ${t().submit_request}</button>
    `:`
      ${!leaves||leaves.length===0
        ?`<div class="empty"><div class="empty-icon">🌴</div><div class="empty-title">${t().no_leaves}</div><div class="empty-sub">${t().no_leaves_sub}</div></div>`
        :leaves.map(lv=>{
          const days = calcLeaveDays(lv.start_date,lv.end_date);
          const deductible = DEDUCTIBLE_TYPES.includes(lv.leave_type?.toLowerCase());
          return `<div class="leave-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-size:14px;font-weight:700;color:var(--text)">${lv.leave_type}</span>
                <span style="font-size:11px;font-weight:700;color:${deductible&&lv.status==='approved'?'var(--red)':'var(--muted)'};background:${deductible&&lv.status==='approved'?'var(--red-dim)':'var(--surface-3)'};border-radius:var(--r-sm);padding:2px 8px">
                  ${deductible&&lv.status==='approved'?`−${days} ${lang==='ar'?'يوم':'d'}`:`${days} ${lang==='ar'?'يوم':'d'}`}
                </span>
              </div>
              <span class="badge" style="background:${statusColor(lv.status)}20;color:${statusColor(lv.status)};border:1px solid ${statusColor(lv.status)}30">${lv.status?.toUpperCase()}</span>
            </div>
            <div style="font-size:13px;color:var(--sub);margin-bottom:4px">📅 ${fmtDate(lv.start_date)} — ${fmtDate(lv.end_date)}</div>
            ${lv.reason?`<div style="font-size:12px;color:var(--muted);margin-top:6px;font-style:italic">"${lv.reason}"</div>`:''}
          </div>`;
        }).join('')}
    `}
  `;
}

function setLeaveTab(tab) { leaveTab=tab; renderLeave(); }
function setLeaveType(tp)  { leaveType=tp; renderLeave(); }
function updateDays() {
  const s=$('lv_start')?.value, e=$('lv_end')?.value;
  if(!s||!e) return;
  const days = Math.ceil((new Date(e)-new Date(s))/86400000)+1;
  const pill = $('daysPill');
  if(pill&&days>0) pill.innerHTML=`<div class="days-pill"><div class="days-pill-val">📅 ${days} ${days>1?t().days:t().day}</div></div>`;
}

async function submitLeave() {
  const start=$('lv_start')?.value, end=$('lv_end')?.value, reason=$('lv_reason')?.value?.trim();
  if(!start||!end) return toast(t().missing_dates,'error');
  if(end<start)      return toast(t().invalid_dates,'error');
  if(!reason)        return toast(t().missing_reason,'error');
  const days = calcLeaveDays(start,end);
  if(DEDUCTIBLE_TYPES.includes(leaveType?.toLowerCase())) {
    const {data:emp} = await sb.from('employees').select('leave_balance').eq('id',currentEmployee.id).single();
    const bal = emp?.leave_balance??21;
    if(days>bal) return toast(lang==='ar'?`رصيدك ${bal} يوم فقط، والطلب ${days} يوم`:`You only have ${bal} days left, request is ${days} days`,'error');
  }
  const {error} = await sb.from('leave_requests').insert([{employee_id:currentEmployee.id,leave_type:leaveType,start_date:start,end_date:end,reason,status:'pending'}]);
  if(error) return toast(error.message,'error');
  toast(lang==='ar'?'تم إرسال الطلب ✅':'Request submitted ✅','success');
  leaveTab='history'; renderLeave();
}

// ═══ NOTIFICATIONS ═══
async function renderNotifs() {
  const {data:notifs} = await sb.from('notifications').select('*').or(`employee_id.eq.${currentEmployee.id},employee_id.is.null`).order('created_at',{ascending:false}).limit(50);
  const items = notifs||[];
  $('empContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:18px;font-weight:800;color:var(--text);font-family:'Syne',sans-serif">${t().notifications}</div>
      ${items.some(n=>!n.is_read)?`<button onclick="markAllRead()" style="background:var(--sky-dim);border:1px solid rgba(14,165,233,.2);color:var(--sky);padding:6px 12px;border-radius:var(--r-full);font-family:inherit;font-size:11px;font-weight:700;cursor:pointer">${t().mark_all_read}</button>`:''}
    </div>
    ${items.length===0
      ?`<div class="empty"><div class="empty-icon">🔕</div><div class="empty-title">${t().no_notifs}</div><div class="empty-sub">${t().no_notifs_sub}</div></div>`
      :items.map(n=>`
        <div class="notif-item ${!n.is_read?'notif-unread':''}" onclick="markRead(${n.id})" style="opacity:${n.is_read?.75:1}">
          ${!n.is_read?'<div class="notif-dot"></div>':''}
          <div style="flex:1">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:5px;flex-wrap:wrap">
              <span class="badge" style="background:var(--indigo-dim);color:var(--indigo);border:1px solid var(--indigo-mid)">${(n.type||'info').toUpperCase()}</span>
              <span style="font-size:11px;color:var(--muted)">${n.created_at?new Date(n.created_at).toLocaleDateString(lang==='ar'?'ar-EG':'en-US',{month:'short',day:'numeric'}):''}</span>
            </div>
            <div style="font-size:14px;font-weight:${n.is_read?500:600};color:var(--text);line-height:1.5">${n.title||n.message||'Notification'}</div>
            ${n.message&&n.title?`<div style="font-size:13px;color:var(--sub);margin-top:4px;line-height:1.5">${n.message}</div>`:''}
          </div>
        </div>`).join('')}
  `;
  unreadCount = items.filter(n=>!n.is_read).length;
  updateNotifBadge();
}

async function markRead(id) {
  await sb.from('notifications').update({is_read:true}).eq('id',id);
  fetchUnread(); renderNotifs();
}
async function markAllRead() {
  const {data:notifs} = await sb.from('notifications').select('id').or(`employee_id.eq.${currentEmployee.id},employee_id.is.null`).eq('is_read',false);
  if(notifs?.length) await Promise.all(notifs.map(n=>sb.from('notifications').update({is_read:true}).eq('id',n.id)));
  fetchUnread(); renderNotifs();
}
async function fetchUnread() {
  if(!currentEmployee) return;
  const {count} = await sb.from('notifications').select('*',{count:'exact',head:true}).or(`employee_id.eq.${currentEmployee.id},employee_id.is.null`).eq('is_read',false);
  unreadCount = count||0;
  updateNotifBadge();
}

function startRealtimeNotifs() {
  if(!currentEmployee) return;
  sb.channel('notifs_'+currentEmployee.id)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications'}, payload => {
      const n = payload.new;
      if(!n.employee_id || n.employee_id===currentEmployee.id) {
        showPushNotif(n.title||n.message||'Notification');
        fetchUnread();
      }
    })
    .subscribe();
}

function showPushNotif(msg) {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;top:70px;left:50%;transform:translateX(-50%) translateY(-20px);
    background:var(--surface);color:var(--text);
    padding:14px 18px;border-radius:var(--r-xl);
    box-shadow:var(--shadow-lg);z-index:9999;
    border:1px solid var(--border);border-left:4px solid var(--indigo);
    font-size:14px;font-weight:600;max-width:min(320px,88vw);
    display:flex;align-items:center;gap:10px;
    transition:transform .4s cubic-bezier(0.16,1,0.3,1),opacity .4s;
    opacity:0;cursor:pointer;
  `;
  el.innerHTML = `<span style="font-size:20px">🔔</span><span>${msg}</span>`;
  el.onclick = () => { showEmpTab('notifs'); el.remove(); };
  document.body.appendChild(el);
  requestAnimationFrame(()=>{ el.style.transform='translateX(-50%) translateY(0)'; el.style.opacity='1'; });
  setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),400); },4000);
}

function updateNotifBadge() {
  const badge = $('notifBadge');
  if(!badge) return;
  if(unreadCount>0) {
    badge.classList.add('show');
    badge.textContent = unreadCount>9?'9+':unreadCount;
  } else {
    badge.classList.remove('show');
  }
}

// ═══ TASKS ═══
async function renderEmpTasks() {
  const {data:tasks} = await sb.from('tasks').select('*').eq('assigned_to',currentEmployee.id).order('deadline',{ascending:true});
  const items   = tasks||[];
  const pending = items.filter(tk=>tk.status==='pending');
  const done    = items.filter(tk=>tk.status==='done');

  $('empContent').innerHTML = `
    <div style="font-size:18px;font-weight:800;color:var(--text);font-family:'Syne',sans-serif;margin-bottom:16px">✅ ${t().my_tasks}</div>
    ${items.length===0
      ?`<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">${t().no_tasks}</div></div>`
      :`
        ${pending.length>0?`
          <div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.9px;font-family:'Syne',sans-serif">${lang==='ar'?'قيد التنفيذ':'Pending'} (${pending.length})</div>
          ${pending.map(tk=>{
            const isLate = tk.deadline&&tk.deadline<nowISO();
            return `<div class="card-sm" style="border-color:${isLate?'rgba(239,68,68,.3)':''}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                <div style="flex:1">
                  <div style="font-size:15px;font-weight:700;color:var(--text)">${tk.title}</div>
                  ${tk.description?`<div style="font-size:12px;color:var(--sub);margin-top:3px">${tk.description}</div>`:''}
                </div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
                ${tk.deadline?`<span class="badge" style="background:${isLate?'var(--red-dim)':'var(--amber-dim)'};color:${isLate?'var(--red)':'var(--amber)'};border:1px solid ${isLate?'rgba(239,68,68,.2)':'rgba(245,158,11,.2)'}">📅 ${fmtDate(tk.deadline)} ${isLate?'⚠️':''}</span>`:''}
                <button onclick="markTaskDone('${tk.id}')" class="primary-btn" style="padding:7px 14px;font-size:12px;background:var(--green)">✅ ${lang==='ar'?'تم الإنجاز':'Mark Done'}</button>
              </div>
            </div>`;
          }).join('')}
        `:''}
        ${done.length>0?`
          <div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:10px;margin-top:16px;text-transform:uppercase;letter-spacing:.9px;font-family:'Syne',sans-serif">${lang==='ar'?'المنتهية':'Completed'} (${done.length})</div>
          ${done.map(tk=>`
            <div class="card-sm" style="opacity:.55;border-color:rgba(16,185,129,.2)">
              <div style="font-size:14px;font-weight:600;color:var(--sub);text-decoration:line-through">${tk.title}</div>
              ${tk.deadline?`<div style="font-size:11px;color:var(--muted);margin-top:4px">📅 ${fmtDate(tk.deadline)}</div>`:''}
            </div>`).join('')}
        `:''}
      `}
  `;
}

async function markTaskDone(id) {
  const {error} = await sb.from('tasks').update({status:'done'}).eq('id',id);
  if(error) return toast(error.message,'error');
  toast(lang==='ar'?'أحسنت! تم إنجاز التاسك 🎉':'Task completed 🎉','success');
  renderEmpTasks();
}

// ═══ PROFILE ═══
async function renderProfile() {
  const emp = currentEmployee;
  const initials = (emp.first_name?.[0]||'')+(emp.last_name?.[0]||'');
  const {data:recs} = await sb.from('attendance_records').select('*').eq('employee_id',emp.id);
  const done = (recs||[]).filter(r=>r.check_in_time&&r.check_out_time);
  const ot   = done.filter(r=>r.check_in_time<='09:15:00');
  const n    = new Date();
  const mo   = done.filter(r=>{ const d=new Date(r.attendance_date); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); });
  const pct  = done.length>0?Math.round(ot.length/done.length*100):0;

  $('empContent').innerHTML = `
    <div class="profile-hero">
      <div class="avatar-big">${initials}</div>
      <div class="profile-name">${emp.first_name} ${emp.last_name}</div>
      <div class="profile-role">${emp.job_title||''} · ${emp.department||''}</div>
    </div>

    <div class="stats-row">
      <div class="stat-box"><div class="stat-val" style="color:var(--sky)">${done.length}</div><div class="stat-label">${t().total_days}</div></div>
      <div class="stat-box"><div class="stat-val" style="color:var(--green)">${mo.length}</div><div class="stat-label">${t().this_month}</div></div>
      <div class="stat-box"><div class="stat-val" style="color:var(--amber)">${pct}%</div><div class="stat-label">${t().on_time}</div></div>
    </div>

    <div class="card">
      <div class="info-row"><span class="info-label">${t().email_lbl}</span><span class="info-val">${emp.email||'—'}</span></div>
      <div class="info-row"><span class="info-label">${t().phone_lbl}</span><span class="info-val">${emp.phone||'—'}</span></div>
      <div class="info-row"><span class="info-label">${t().position}</span><span class="info-val">${emp.job_title||emp.position||'—'}</span></div>
      <div class="info-row"><span class="info-label">${t().department}</span><span class="info-val">${emp.department||'—'}</span></div>
      <div class="info-row" style="border-bottom:none"><span class="info-label">${t().joined}</span><span class="info-val">${fmtDate(emp.hire_date)||'—'}</span></div>
    </div>

    <div class="setting-row" onclick="">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:12px;background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-size:18px">${darkMode?'🌙':'☀️'}</div>
        <span style="font-size:15px;font-weight:600;color:var(--text)">${darkMode?t().dark_mode:t().light_mode}</span>
      </div>
      <button class="toggle ${darkMode?'on':''}" onclick="toggleDark(event)"><div class="toggle-thumb"></div></button>
    </div>

    <div class="setting-row" onclick="openModal('changePwModal')">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:12px;background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-size:18px">🔐</div>
        <span style="font-size:15px;font-weight:600;color:var(--text)">${t().change_password}</span>
      </div>
      <span style="font-size:20px;color:var(--muted)">›</span>
    </div>

    <button class="primary-btn" style="width:100%;background:var(--red);box-shadow:var(--shadow-red);margin-top:8px;padding:14px" onclick="handleLogout()">
      🚪 ${t().logout}
    </button>
  `;
}

function toggleDark(e) {
  if(e) e.stopPropagation();
  darkMode=!darkMode; applyDark(); renderEmp(empTab);
}

// ═══ CUSTOM PAGE VIEW (EMPLOYEE) ═══
// ═══ CUSTOM PAGE VIEW (DIAGNOSTIC VERSION) ═══
async function renderCustomPage(slug) {
  // 1. نظهر لودينج عشان المستخدم يعرف إنه حصل استجابة
  $('empContent').innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    console.log("Trying to load page with slug:", slug); // سجل الـ slug في الكونسول

    // 2. جلب البيانات
    const {data:page, error} = await sb.from('custom_pages').select('*').eq('slug', slug).single();

    // 3. فحص الأخطاء
    if(error) {
      throw new Error("Database Error: " + error.message);
    }
    if(!page) {
      throw new Error("Page not found in database. Slug: " + slug);
    }

    // 4. عرض الصفحة إذا كل شيء تمام
    $('empContent').innerHTML = `
      <div style="margin-bottom:20px">
        <h1 style="font-size:22px;font-weight:800;color:var(--text);margin-bottom:8px">${page.title}</h1>
        <div style="height:4px;width:50px;background:var(--indigo);border-radius:2px"></div>
      </div>
      <div class="card" style="padding:20px;line-height:1.7;color:var(--text);font-size:15px">
        ${page.content ? page.content : '<span style="color:var(--muted)">لا يوجد محتوى (No content)</span>'}
      </div>
    `;

  } catch (e) {
    // 5. عرض الخطأ بوضوح للمستخدم (Root Fix: Transparency)
    console.error("Custom Page Error:", e);
    $('empContent').innerHTML = `
      <div style="padding:20px;text-align:center;border:1px solid var(--red);border-radius:12px;color:var(--red)">
        <h3 style="margin-bottom:10px">⚠️ Error Loading Page</h3>
        <p style="margin-bottom:10px">${e.message}</p>
        <p style="font-size:12px;color:var(--muted)">Slug you tried: ${slug}</p>
        <button onclick="renderEmp('home')" class="primary-btn">Go Home</button>
      </div>
    `;
  }
}
// ═══ INIT ═══
function init() {
  applyDark();
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang==='ar'?'rtl':'ltr';
  updateLangBtns();
  updateStaticText();
  renderLogin();
  sb.auth.getSession().then(({data:{session}})=>{
    if(session) {
      currentUser = session.user;
      sb.from('employees').select('*').eq('email',session.user.email).single().then(({data:emp})=>{
        if(emp) {
          currentEmployee = emp;
          isAdmin = emp.email==='admin@merge.com';
          if(isAdmin) { showScreen('hrApp'); initHR(); }
          else { showScreen('empApp'); initEmp(); fetchUnread(); startRealtimeNotifs(); }
        }
      });
    }
  });
}
init();
