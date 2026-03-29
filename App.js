import {
  Text, View, TextInput, Alert, ActivityIndicator,
  TouchableOpacity, Animated, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Switch, Image, Modal,
  Dimensions, Pressable
} from 'react-native';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import * as Location from 'expo-location';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

let MapView = null, Marker = null, Circle = null;
if (Platform.OS !== 'web') {
  try {
    const m = require('react-native-maps');
    MapView = m.default; Marker = m.Marker; Circle = m.Circle;
  } catch (_) {}
}

const LOGO_IMG = require('./assets/logo.png');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const IS_DESKTOP = IS_WEB && SCREEN_WIDTH > 768;

/* ═══════════════════ THEME ═══════════════════ */
const TH = {
  dark: {
    bg:'#0B1120', card:'#111B2E', surface:'#162035', border:'#1E2D45',
    text:'#F1F5F9', sub:'#7B93AD', muted:'#4A6178',
    sky:'#38BDF8', skyDim:'rgba(56,189,248,0.12)', skyBorder:'rgba(56,189,248,0.25)',
    green:'#22C55E', greenDim:'rgba(34,197,94,0.12)',
    red:'#EF4444', redDim:'rgba(239,68,68,0.12)',
    amber:'#F59E0B', amberDim:'rgba(245,158,11,0.12)',
    purple:'#A855F7', purpleDim:'rgba(168,85,247,0.12)',
    indigo:'#6366F1', indigoDim:'rgba(99,102,241,0.12)',
    inputBg:'#0A0F1A',
  },
  light: {
    bg:'#F0F7FF', card:'#FFFFFF', surface:'#E8F0FA', border:'#D6E4F0',
    text:'#0B1120', sub:'#5F7A94', muted:'#8BA0B8',
    sky:'#0284C7', skyDim:'rgba(2,132,199,0.08)', skyBorder:'rgba(2,132,199,0.18)',
    green:'#16A34A', greenDim:'rgba(22,163,74,0.08)',
    red:'#DC2626', redDim:'rgba(220,38,38,0.08)',
    amber:'#D97706', amberDim:'rgba(217,119,6,0.08)',
    purple:'#9333EA', purpleDim:'rgba(147,51,234,0.08)',
    indigo:'#4F46E5', indigoDim:'rgba(79,70,229,0.08)',
    inputBg:'#F8FAFF',
  },
};
const useT = (d) => TH[d ? 'dark' : 'light'];

/* ═══════════════════ i18n ═══════════════════ */
const L = {
  en: {
    welcome_back:'Welcome Back', sign_in_sub:'Sign in to your employee account',
    email:'Email Address', password:'Password', sign_in:'Sign In',
    enter_email:'name@company.com', enter_pw:'Enter your password',
    forgot_pw:'Forgot Password?', reset_title:'Reset Password', reset_sub:'Enter your email to receive a reset link.',
    reset_sent:'Reset Link Sent', reset_sent_msg:'Check your email for the password reset link.',
    good_morning:'Good Morning', good_afternoon:'Good Afternoon', good_evening:'Good Evening',
    clocked_in:'Currently Clocked In', todays_att:"Today's Attendance",
    check_in:'Check In', check_out:'Check Out', active:'ACTIVE',
    quick_actions:'Quick Actions', location:'Location', history:'History',
    leave:'Leave', change_pw:'Password', hr_panel:'HR Panel', logout:'Logout', profile:'Profile ›',
    attendance_history:'Attendance History', records:'records',
    complete:'COMPLETE', in_progress:'IN PROGRESS', missing:'MISSING',
    check_in_label:'Check In', check_out_label:'Check Out',
    no_records:'No Records', no_records_sub:'Your attendance history will appear here after your first check-in.',
    my_location:'My Location', office_info:'Office Info', allowed_radius:'Allowed Radius', your_distance:'Your Distance',
    loc_denied:'Location Access Denied', loc_denied_sub:'Enable location permissions to see your position.',
    leave_request:'Leave Request', new_request:'New Request', my_leaves:'My Leaves',
    leave_type:'Leave Type', start_date:'Start Date', end_date:'End Date',
    reason:'Reason', describe_reason:'Describe your reason...', submit_request:'Submit Request',
    day:'Day', days:'Days', invalid_dates:'End date must be after start date.',
    missing_dates:'Please select start and end dates.', missing_reason:'Please provide a reason.',
    submitted:'Submitted ✓', submitted_msg:'Your leave request has been submitted.',
    no_leaves:'No Leave Requests', no_leaves_sub:"You haven't submitted any leave requests yet.",
    notifications:'Notifications', mark_all_read:'Mark All Read',
    no_notifs:'No Notifications', no_notifs_sub:"You're all caught up.",
    my_profile:'My Profile', total_days:'Total Days', this_month:'This Month', on_time:'On Time',
    phone:'Phone', position:'Position', department:'Department', joined:'Joined',
    dark_mode:'Dark Mode', light_mode:'Light Mode', change_password:'Change Password',
    recent_leaves:'Recent Leave Requests',
    current_pw:'Current Password', new_pw:'New Password', confirm_pw:'Confirm New Password',
    update_pw:'Update Password', weak_pw:'Password must be at least 6 characters.',
    mismatch:'Passwords do not match.', pw_success:'Password changed successfully.', pw_hint:'Use a strong password with at least 6 characters.',
    hr_dashboard:'HR Dashboard', overview:'Overview', attendance_tab:'Attendance',
    leaves_tab:'Leaves', employees_tab:'Employees', notifs_tab:'Notifications', export_tab:'Export',
    total_employees:'Total Employees', present:'Present', absent:'Absent', pending_leaves:'Pending Leaves',
    quick_actions_hr:'Quick Actions', review_att:'Review Attendance', leave_req:'Leave Requests',
    emp_list:'Employee List', send_notif:'Send Notification',
    latest_att:'Latest Attendance', no_att_today:'No attendance recorded today.',
    att_records:'Attendance Records', entry:'Entry', exit:'Exit',
    leave_reqs:'Leave Requests', under_review:'Under Review', approve:'Approve', reject:'Reject',
    emp_list_title:'Employee List', search_emp:'Search by name or code...', active_st:'Active', inactive_st:'Inactive',
    send_notif_title:'Send Notification', notif_type:'Notification Type',
    announcement:'Announcement', reminder:'Reminder', alert:'Alert',
    notif_text:'Notification Text', write_text:'Write notification text here...',
    send_all:'Send to All', will_send_to:'Will be sent to', employee_word:'employees',
    select_type:'Select Data Type', from_date:'From Date', to_date:'To Date',
    generate_download:'Generate & Download', loading:'Loading data...',
    back:'Back', not_available:'Not Available',
    out_of_range:'Out of Range', already_in:'Already Checked In', not_checked_in:'Not Checked In',
    already_out:'Already Checked Out', checked_in:'Checked In ✓', checked_out:'Checked Out ✓',
    loc_error:'Location Error', enable_gps:'Please enable GPS and try again.',
    cancel:'Cancel', pick_date:'Pick Date',
    su:'Su', mo:'Mo', tu:'Tu', we:'We', th:'Th', fr:'Fr', sa:'Sa',
    jan:'January', feb:'February', mar:'March', apr:'April', may:'May', jun:'June',
    jul:'July', aug:'August', sep:'September', oct:'October', nov:'November', dec:'December',
  },
  ar: {
    welcome_back:'مرحباً بعودتك', sign_in_sub:'سجّل الدخول إلى حسابك',
    email:'البريد الإلكتروني', password:'كلمة المرور', sign_in:'تسجيل الدخول',
    enter_email:'name@company.com', enter_pw:'أدخل كلمة المرور',
    forgot_pw:'نسيت كلمة المرور؟', reset_title:'إعادة تعيين كلمة المرور', reset_sub:'أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين.',
    reset_sent:'تم إرسال الرابط', reset_sent_msg:'تحقق من بريدك الإلكتروني لرابط إعادة التعيين.',
    good_morning:'صباح الخير', good_afternoon:'مساء الخير', good_evening:'مساء الخير',
    clocked_in:'مسجّل دخول حالياً', todays_att:'حضور اليوم',
    check_in:'تسجيل دخول', check_out:'تسجيل خروج', active:'نشط',
    quick_actions:'إجراءات سريعة', location:'الموقع', history:'السجل',
    leave:'إجازة', change_pw:'كلمة المرور', hr_panel:'لوحة التحكم', logout:'تسجيل خروج', profile:'الملف الشخصي ›',
    attendance_history:'سجل الحضور', records:'سجل',
    complete:'مكتمل', in_progress:'قيد العمل', missing:'مفقود',
    check_in_label:'دخول', check_out_label:'خروج',
    no_records:'لا توجد سجلات', no_records_sub:'سيظهر سجل حضورك هنا بعد أول تسجيل دخول.',
    my_location:'موقعي', office_info:'معلومات المكتب', allowed_radius:'نطاق مسموح', your_distance:'المسافة الحالية',
    loc_denied:'تم رفض الوصول للموقع', loc_denied_sub:'فعّل أذونات الموقع لرؤية موقعك.',
    leave_request:'طلب إجازة', new_request:'طلب جديد', my_leaves:'إجازاتي',
    leave_type:'نوع الإجازة', start_date:'تاريخ البداية', end_date:'تاريخ النهاية',
    reason:'السبب', describe_reason:'اكتب السبب هنا...', submit_request:'إرسال الطلب',
    day:'يوم', days:'أيام', invalid_dates:'تاريخ النهاية يجب أن يكون بعد تاريخ البداية.',
    missing_dates:'الرجاء اختيار تاريخ البداية والنهاية.', missing_reason:'الرجاء كتابة السبب.',
    submitted:'تم الإرسال ✓', submitted_msg:'تم إرسال طلب الإجازة بنجاح.',
    no_leaves:'لا توجد طلبات إجازة', no_leaves_sub:'لم تقدم أي طلبات إجازة بعد.',
    notifications:'الإشعارات', mark_all_read:'قراءة الكل',
    no_notifs:'لا توجد إشعارات', no_notifs_sub:'ليس لديك إشعارات جديدة.',
    my_profile:'ملفي الشخصي', total_days:'إجمالي الأيام', this_month:'هذا الشهر', on_time:'في الوقت',
    phone:'الهاتف', position:'المنصب', department:'القسم', joined:'تاريخ الانضمام',
    dark_mode:'الوضع الداكن', light_mode:'الوضع الفاتح', change_password:'تغيير كلمة المرور',
    recent_leaves:'طلبات الإجازة الأخيرة',
    current_pw:'كلمة المرور الحالية', new_pw:'كلمة المرور الجديدة', confirm_pw:'تأكيد كلمة المرور',
    update_pw:'تحديث كلمة المرور', weak_pw:'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    mismatch:'كلمات المرور غير متطابقة.', pw_success:'تم تغيير كلمة المرور بنجاح.', pw_hint:'استخدم كلمة مرور قوية من 6 أحرف على الأقل.',
    hr_dashboard:'لوحة التحكم', overview:'نظرة عامة', attendance_tab:'الحضور',
    leaves_tab:'الإجازات', employees_tab:'الموظفين', notifs_tab:'إشعارات', export_tab:'تصدير',
    total_employees:'إجمالي الموظفين', present:'حاضر', absent:'غائب', pending_leaves:'طلبات معلقة',
    quick_actions_hr:'إجراءات سريعة', review_att:'مراجعة الحضور', leave_req:'طلبات الإجازة',
    emp_list:'قائمة الموظفين', send_notif:'إرسال إشعار',
    latest_att:'آخر سجلات الحضور', no_att_today:'لا يوجد حضور مسجل اليوم.',
    att_records:'سجلات الحضور', entry:'دخول', exit:'خروج',
    leave_reqs:'طلبات الإجازة', under_review:'قيد المراجعة', approve:'موافقة', reject:'رفض',
    emp_list_title:'قائمة الموظفين', search_emp:'ابحث بالاسم أو الكود...', active_st:'نشط', inactive_st:'غير نشط',
    send_notif_title:'إرسال إشعار', notif_type:'نوع الإشعار',
    announcement:'إعلان', reminder:'تذكير', alert:'تنبيه',
    notif_text:'نص الإشعار', write_text:'اكتب نص الإشعار هنا...',
    send_all:'إرسال للجميع', will_send_to:'سيتم الإرسال إلى', employee_word:'موظف',
    select_type:'اختر نوع البيانات', from_date:'من تاريخ', to_date:'إلى تاريخ',
    generate_download:'إنشاء وتحميل', loading:'جاري التحميل...',
    back:'رجوع', not_available:'غير متاح',
    out_of_range:'خارج النطاق', already_in:'مسجّل دخول بالفعل', not_checked_in:'لم تسجّل دخول',
    already_out:'مسجّل خروج بالفعل', checked_in:'تم تسجيل الدخول ✓', checked_out:'تم تسجيل الخروج ✓',
    loc_error:'خطأ في الموقع', enable_gps:'يرجى تفعيل GPS والمحاولة مرة أخرى.',
    cancel:'إلغاء', pick_date:'اختر التاريخ',
    su:'أح', mo:'إث', tu:'ثل', we:'أر', th:'خم', fr:'جم', sa:'سب',
    jan:'يناير', feb:'فبراير', mar:'مارس', apr:'أبريل', may:'مايو', jun:'يونيو',
    jul:'يوليو', aug:'أغسطس', sep:'سبتمبر', oct:'أكتوبر', nov:'نوفمبر', dec:'ديسمبر',
  },
};
const useT_hook = (d) => TH[d ? 'dark' : 'light'];

/* ═══════════════════ UTILITIES ═══════════════════ */
const haversine = (a,b,c,d) => {
  const R=6371000, r=x=>x*Math.PI/180, dl=r(c-a), dn=r(d-b);
  return R*2*Math.atan2(Math.sqrt(Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2),Math.sqrt(1-(Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2)));
};
const fmtTime = t => t ? t.slice(0,5) : '—';
const fmtDate = (d,lang) => {
  if(!d) return '';
  const dt = new Date(d+'T00:00:00');
  return dt.toLocaleDateString(lang==='ar'?'ar-EG':'en-US',{month:'short',day:'numeric',year:'numeric'});
};
const getGreeting = (lang) => {
  const h = new Date().getHours();
  return lang==='ar' ? (h<12?'صباح الخير':h<17?'مساء الخير':'مساء الخير') : (h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening');
};
const nowISO = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().split(' ')[0];

const openWebDatePicker = (currentVal, onPick) => {
  if (Platform.OS !== 'web') return;
  const el = document.createElement('input');
  el.type = 'date'; el.value = currentVal || '';
  el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(el);
  const clean = () => setTimeout(() => { try{document.body.removeChild(el)}catch(e){} },300);
  el.addEventListener('change', e => { if(e.target.value) onPick(e.target.value); clean(); });
  el.addEventListener('blur', clean);
  if(el.showPicker) el.showPicker(); else { el.focus(); el.click(); }
};

/* ═══════════════════ REUSABLE COMPONENTS ═══════════════════ */
const ScreenWrap = ({children,dark}) => {
  const ins = useSafeAreaInsets(), t = useT_hook(dark);
  return <View style={{flex:1,backgroundColor:t.bg,paddingTop:ins.top,paddingBottom:ins.bottom}}>{children}</View>;
};

const LangToggle = ({dark,lang,setLang}) => {
  const t = useT_hook(dark);
  return (
    <TouchableOpacity onPress={()=>setLang(lang==='en'?'ar':'en')} activeOpacity={0.7}
      style={{backgroundColor:t.skyDim,borderRadius:10,paddingHorizontal:10,paddingVertical:6,borderWidth:1,borderColor:t.skyBorder}}>
      <Text style={{color:t.sky,fontWeight:'700',fontSize:12}}>🌐 {lang==='en'?'عربي':'EN'}</Text>
    </TouchableOpacity>
  );
};

const ScreenHeader = ({dark,title,onBack,right,lang,setLang}) => {
  const t = useT_hook(dark), ins = useSafeAreaInsets();
  return (
    <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingTop:10,paddingBottom:14,
      backgroundColor:t.bg,borderBottomWidth:1,borderBottomColor:t.border,marginTop:ins.top}}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7}
        style={{width:38,height:38,borderRadius:19,backgroundColor:t.skyDim,alignItems:'center',justifyContent:'center'}}>
        <Text style={{color:t.sky,fontSize:18,fontWeight:'700', textAlign: 'center'}}>{lang === 'ar' ? '›' : '‹'}</Text>
      </TouchableOpacity>
      <Text style={{flex:1,fontSize:18,fontWeight:'700',color:t.text,marginHorizontal:12,textAlign:lang==='ar'?'right':'left'}}>{title}</Text>
      {setLang && <LangToggle dark={dark} lang={lang} setLang={setLang} />}
      {right}
    </View>
  );
};

const AppBtn = ({dark,label,icon,color,loading,disabled,onPress,style}) => {
  const t=useT_hook(dark), c=color||t.sky, dis=disabled||loading;
  return (
    <TouchableOpacity onPress={onPress} disabled={dis} activeOpacity={0.75}
      style={[{flexDirection:'row',alignItems:'center',justifyContent:'center',height:52,borderRadius:14,paddingHorizontal:20,
        backgroundColor:dis?t.surface:c,opacity:dis?0.45:1},style]}>
      {loading ? <ActivityIndicator color="#fff" size="small" />
        : <>{icon&&<Text style={{fontSize:18,marginRight:8}}>{icon}</Text>}<Text style={{color:dis?t.sub:'#fff',fontWeight:'700',fontSize:15}}>{label}</Text></>}
    </TouchableOpacity>
  );
};

const ActionCard = ({dark,icon,label,color,disabled,onPress}) => {
  const t=useT_hook(dark), c=color||t.sky;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}
      style={{flex:1, minWidth: IS_DESKTOP ? 150 : '30%', paddingVertical:18,paddingHorizontal:10,borderRadius:16,alignItems:'center',justifyContent:'center',
        backgroundColor:t.card,borderWidth:1.5,borderColor:disabled?t.border:c+'30',opacity:disabled?0.4:1}}>
      <Text style={{fontSize:26,marginBottom:8}}>{icon}</Text>
      <Text style={{fontSize:12,fontWeight:'700',color:disabled?t.sub:c,letterSpacing:0.3, textAlign: 'center'}}>{label}</Text>
    </TouchableOpacity>
  );
};

const Badge = ({dark,label,color}) => {
  const t=useT_hook(dark), c=color||t.sky;
  return <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:8,backgroundColor:c+'18'}}>
    <Text style={{fontSize:11,fontWeight:'700',color:c,letterSpacing:0.4}}>{label}</Text></View>;
};

const Empty = ({dark,icon,title,sub}) => {
  const t=useT_hook(dark);
  return <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:50}}>
    <Text style={{fontSize:52,marginBottom:16}}>{icon}</Text>
    <Text style={{fontSize:18,fontWeight:'700',color:t.text,marginBottom:6}}>{title}</Text>
    <Text style={{fontSize:14,color:t.sub,textAlign:'center',lineHeight:20}}>{sub}</Text></View>;
};

const StatBox = ({dark,value,label,color}) => {
  const t=useT_hook(dark), c=color||t.sky;
  return <View style={{flex:1,borderRadius:14,padding:16,alignItems:'center',backgroundColor:t.card,borderWidth:1,borderColor:t.border}}>
    <Text style={{fontSize:28,fontWeight:'800',color:c}}>{value}</Text>
    <Text style={{fontSize:11,color:t.sub,marginTop:2,fontWeight:'600',letterSpacing:0.3}}>{label}</Text></View>;
};

const InfoRow = ({dark,label,value,lang}) => {
  const t=useT_hook(dark);
  return <View style={{flexDirection:'row',paddingVertical:13,borderBottomWidth:1,borderBottomColor:t.border}}>
    <Text style={{width:110,fontSize:13,color:t.sub,fontWeight:'500',textAlign:lang==='ar'?'right':'left'}}>{label}</Text>
    <Text style={{flex:1,fontSize:14,color:t.text,fontWeight:'600',textAlign:lang==='ar'?'right':'left'}}>{value||'—'}</Text></View>;
};

/* ═══════════════════ CALENDAR PICKER ═══════════════════ */
const CalendarPicker = ({dark, value, onChange, lang}) => {
  const t=useT_hook(dark), l=L[lang];
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date(value || nowISO()));

  const yr = month.getFullYear(), mo = month.getMonth();
  const firstDow = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo+1, 0).getDate();
  const days = [];
  for(let i=0;i<firstDow;i++) days.push(null);
  for(let i=1;i<=daysInMonth;i++) days.push(i);

  const mNames = [l.jan,l.feb,l.mar,l.apr,l.may,l.jun,l.jul,l.aug,l.sep,l.oct,l.nov,l.dec];
  const dNames = [l.su,l.mo,l.tu,l.we,l.th,l.fr,l.sa];

  const selDay = (d) => {
    const ds = `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    onChange(ds); setOpen(false);
  };

  const isSel = (d) => d && value === `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isToday = (d) => d && `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` === nowISO();

  if(Platform.OS==='web'){
    return (
      <TouchableOpacity onPress={()=>openWebDatePicker(value,onChange)} activeOpacity={0.7}
        style={{flex:1,height:50,backgroundColor:t.inputBg,borderRadius:12,paddingHorizontal:14,borderWidth:1,borderColor:t.border,
          flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
        <Text style={{color:value?t.text:'#8BA0B8',fontSize:14,fontWeight:'500'}}>{value||'YYYY-MM-DD'}</Text>
        <Text style={{fontSize:16}}>📅</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity onPress={()=>{setMonth(new Date(value||nowISO()));setOpen(true);}} activeOpacity={0.7}
        style={{flex:1,height:50,backgroundColor:t.inputBg,borderRadius:12,paddingHorizontal:14,borderWidth:1,borderColor:t.border,
          flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
        <Text style={{color:value?t.text:'#8BA0B8',fontSize:14,fontWeight:'500'}}>{value||'YYYY-MM-DD'}</Text>
        <Text style={{fontSize:16}}>📅</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
        <Pressable style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:20}} onPress={()=>setOpen(false)}>
          <Pressable style={{backgroundColor:t.card,borderRadius:20,padding:20,width:'100%',maxWidth:360,
            shadowColor:'#000',shadowOffset:{width:0,height:10},shadowOpacity:0.3,shadowRadius:30,elevation:15}}>
            {/* Month Nav */}
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <TouchableOpacity onPress={()=>setMonth(new Date(yr,mo-1,1))} hitSlop={10} style={{width:36,height:36,borderRadius:18,backgroundColor:t.surface,alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:t.text,fontSize:16,fontWeight:'700'}}>‹</Text></TouchableOpacity>
              <Text style={{color:t.text,fontWeight:'700',fontSize:16}}>{mNames[mo]} {yr}</Text>
              <TouchableOpacity onPress={()=>setMonth(new Date(yr,mo+1,1))} hitSlop={10} style={{width:36,height:36,borderRadius:18,backgroundColor:t.surface,alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:t.text,fontSize:16,fontWeight:'700'}}>›</Text></TouchableOpacity>
            </View>
            {/* Day Names */}
            <View style={{flexDirection:'row',marginBottom:8}}>
              {dNames.map(d=><View key={d} style={{flex:1,alignItems:'center'}}><Text style={{fontSize:12,color:t.muted,fontWeight:'600'}}>{d}</Text></View>)}
            </View>
            {/* Days Grid */}
            <View style={{flexDirection:'row',flexWrap:'wrap'}}>
              {days.map((d,i)=>{
                if(d===null) return <View key={`e${i}`} style={{width:'14.28%',height:42}} />;
                const selected = isSel(d), today = isToday(d);
                return (
                  <TouchableOpacity key={d} onPress={()=>selDay(d)}
                    style={{width:'14.28%',height:42,alignItems:'center',justifyContent:'center',borderRadius:12}}>
                    <View style={{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',
                      backgroundColor:selected?t.sky:today?t.skyDim:'transparent'}}>
                      <Text style={{fontSize:14,fontWeight:selected?'700':'500',color:selected?'#fff':today?t.sky:t.text}}>{d}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={()=>setOpen(false)} style={{marginTop:16,paddingVertical:12,borderRadius:12,backgroundColor:t.surface,alignItems:'center'}}>
              <Text style={{color:t.sub,fontWeight:'600',fontSize:14}}>{l.cancel}</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

/* ═══════════════════ LOGIN SCREEN ═══════════════════ */
const LoginScreen = ({onLogin,lang,setLang}) => {
  const [email,setEmail]=useState(''),[pw,setPw]=useState(''),[showPw,setShowPw]=useState(false),[loading,setLoading]=useState(false);
  const [resetOpen,setResetOpen]=useState(false),[resetEmail,setResetEmail]=useState(''),[resetLoading,setResetLoading]=useState(false);
  const l=L[lang];
  const logoScale=useRef(new Animated.Value(0.5)).current;
  const logoOp=useRef(new Animated.Value(0)).current;
  const tagOp=useRef(new Animated.Value(0)).current;
  const cardOp=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,{toValue:1,friction:4,tension:40,useNativeDriver:true}),
        Animated.timing(logoOp,{toValue:1,duration:600,useNativeDriver:true}),
      ]),
      Animated.timing(tagOp,{toValue:1,duration:400,useNativeDriver:true}),
      Animated.timing(cardOp,{toValue:1,duration:500,useNativeDriver:true}),
    ]).start();
  },[]);

  const handleLogin = async () => {
    if(!email.trim()) return Alert.alert('',lang==='ar'?'الرجاء إدخال البريد الإلكتروني':'Please enter your email.');
    if(!pw.trim()) return Alert.alert('',lang==='ar'?'الرجاء إدخال كلمة المرور':'Please enter your password.');
    setLoading(true);
    const {error} = await supabase.auth.signInWithPassword({email:email.trim(),password:pw});
    setLoading(false);
    if(error) Alert.alert(lang==='ar'?'فشل تسجيل الدخول':'Login Failed',error.message);
  };

  const handleReset = async () => {
    if(!resetEmail.trim()) return Alert.alert('',lang==='ar'?'الرجاء إدخال البريد الإلكتروني':'Please enter your email.');
    setResetLoading(true);
    const {error} = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
    setResetLoading(false);
    if(error){Alert.alert('Error',error.message);return;}
    Alert.alert(l.reset_sent,l.reset_sent_msg);
    setResetOpen(false);setResetEmail('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1,backgroundColor:'#FFFFFF'}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
        <View style={{flex:1, justifyContent:'center', alignItems: 'center'}}>
          {/* Light decorative circles */}
          <View style={{position:'absolute',top:-100,right:-60,width:350,height:350,borderRadius:175,backgroundColor:'rgba(56,189,248,0.05)'}} />
          <View style={{position:'absolute',bottom:-120,left:-80,width:400,height:400,borderRadius:200,backgroundColor:'rgba(34,197,94,0.04)'}} />

          {/* Language Toggle */}
          <View style={{position:'absolute',top:50,right:20,zIndex:10}}>
            <LangToggle dark={false} lang={lang} setLang={setLang} />
          </View>

          <View style={{width: '100%', maxWidth: 450, paddingHorizontal:28}}>
            {/* Logo */}
            <View style={{alignItems:'center',marginBottom:32}}>
              <Animated.View style={{opacity:logoOp,transform:[{scale:logoScale}]}}>
                <Image source={LOGO_IMG} style={{width:180,height:115,resizeMode:'contain'}} />
              </Animated.View>
              <Animated.Text style={{color:'#94A3B8',fontSize:13,marginTop:6,letterSpacing:2,opacity:tagOp,fontWeight:'500'}}>
                Your Job Way
              </Animated.Text>
            </View>

            {/* Card */}
            <Animated.View style={{opacity:cardOp}}>
              <Text style={{color:'#0B1120',fontSize:22,fontWeight:'700',marginBottom:4,textAlign:lang==='ar'?'right':'left'}}>{l.welcome_back}</Text>
              <Text style={{color:'#64748B',fontSize:14,marginBottom:24,textAlign:lang==='ar'?'right':'left'}}>{l.sign_in_sub}</Text>

              {/* Email */}
              <View style={{marginBottom:14}}>
                <Text style={{color:'#64748B',fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.8,marginBottom:6,textAlign:lang==='ar'?'right':'left'}}>{l.email}</Text>
                <View style={{flexDirection:'row',alignItems:'center',height:52,backgroundColor:'#F8FAFF',borderRadius:12,paddingHorizontal:14, borderWidth: 1, borderColor: '#E2E8F0'}}>
                  <TextInput style={{flex:1,color:'#0B1120',fontSize:15,fontWeight:'500',padding:0,textAlign:lang==='ar'?'right':'left'}}
                    placeholder={l.enter_email} placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>
              </View>

              {/* Password */}
              <View style={{marginBottom:6}}>
                <Text style={{color:'#64748B',fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.8,marginBottom:6,textAlign:lang==='ar'?'right':'left'}}>{l.password}</Text>
                <View style={{flexDirection:'row',alignItems:'center',height:52,backgroundColor:'#F8FAFF',borderRadius:12,paddingHorizontal:14, borderWidth: 1, borderColor: '#E2E8F0'}}>
                  <TextInput style={{flex:1,color:'#0B1120',fontSize:15,fontWeight:'500',padding:0,textAlign:lang==='ar'?'right':'left'}}
                    placeholder={l.enter_pw} placeholderTextColor="#94A3B8" value={pw} onChangeText={setPw} secureTextEntry={!showPw} />
                  <TouchableOpacity onPress={()=>setShowPw(!showPw)} hitSlop={10} style={{marginLeft:8}}>
                    <Text style={{fontSize:18,color:'#94A3B8'}}>{showPw?'🙈':'👁'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity onPress={()=>setResetOpen(true)} style={{marginBottom:20,paddingVertical:4}}>
                <Text style={{color:'#0284C7',fontSize:13,fontWeight:'600',textAlign:lang==='ar'?'right':'left'}}>{l.forgot_pw}</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}
                style={{height:54,borderRadius:14,backgroundColor:'#38BDF8',alignItems:'center',justifyContent:'center',
                  shadowColor:'#38BDF8',shadowOffset:{width:0,height:8},shadowOpacity:0.25,shadowRadius:20,elevation:5,opacity:loading?0.6:1}}>
                {loading ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{color:'#FFFFFF',fontWeight:'800',fontSize:16}}>{l.sign_in}</Text>}
              </TouchableOpacity>

              <Text style={{color:'#CBD5E1',fontSize:11,textAlign:'center',marginTop:24}}>Merge HR Portal v2.0</Text>
            </Animated.View>
          </View>
        </View>
      </ScrollView>

      {/* Reset Password Modal */}
      <Modal visible={resetOpen} transparent animationType="fade" onRequestClose={()=>setResetOpen(false)}>
        <Pressable style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',alignItems:'center',padding:28}} onPress={()=>setResetOpen(false)}>
          <Pressable style={{backgroundColor:'#FFFFFF',borderRadius:20,padding:24,width:'100%',maxWidth:360,
            shadowColor:'#000',shadowOffset:{width:0,height:10},shadowOpacity:0.15,shadowRadius:30,elevation:12}}>
            <Text style={{color:'#0B1120',fontSize:18,fontWeight:'700',marginBottom:4,textAlign:lang==='ar'?'right':'left'}}>{l.reset_title}</Text>
            <Text style={{color:'#64748B',fontSize:13,marginBottom:20,textAlign:lang==='ar'?'right':'left'}}>{l.reset_sub}</Text>
            <TextInput style={{height:52,backgroundColor:'#F8FAFF',borderRadius:12,paddingHorizontal:14,color:'#0B1120',fontSize:15,fontWeight:'500',marginBottom:16,textAlign:lang==='ar'?'right':'left', borderWidth: 1, borderColor: '#E2E8F0'}}
              placeholder={l.enter_email} placeholderTextColor="#94A3B8" value={resetEmail} onChangeText={setResetEmail} autoCapitalize="none" keyboardType="email-address" />
            <TouchableOpacity onPress={handleReset} disabled={resetLoading}
              style={{height:50,borderRadius:12,backgroundColor:'#38BDF8',alignItems:'center',justifyContent:'center',opacity:resetLoading?0.6:1}}>
              {resetLoading?<ActivityIndicator color="#fff" size="small" />:<Text style={{color:'#fff',fontWeight:'700',fontSize:15}}>{l.sign_in}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setResetOpen(false)} style={{marginTop:12,paddingVertical:8,alignItems:'center'}}>
              <Text style={{color:'#94A3B8',fontSize:14,fontWeight:'500'}}>{l.cancel}</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};

/* ═══════════════════ HOME SCREEN ═══════════════════ */
const HomeScreen = ({dark,employee,isClockedIn,checkingIn,checkingOut,unreadCount,onCheckIn,onCheckOut,onNav,lang,setLang}) => {
  const t=useT_hook(dark), l=L[lang];
  const fadeAnim=useRef(new Animated.Value(0)).current;
  const slideAnim=useRef(new Animated.Value(30)).current;
  const floatAnim=useRef(new Animated.Value(0)).current;
  useEffect(()=>{fadeAnim.setValue(0);slideAnim.setValue(30);Animated.parallel([Animated.timing(fadeAnim,{toValue:1,duration:500,useNativeDriver:true}),Animated.timing(slideAnim,{toValue:0,duration:500,useNativeDriver:true})]).start();},[]);
  useEffect(()=>{Animated.loop(Animated.sequence([Animated.timing(floatAnim,{toValue:-2,duration:2000,useNativeDriver:true}),Animated.timing(floatAnim,{toValue:0,duration:2000,useNativeDriver:true})])).start();},[]);
  const initials=employee?(employee.first_name?.[0]||'')+(employee.last_name?.[0]||''):'??';
  
  return (
    <ScrollView style={{flex:1,backgroundColor:t.bg}} contentContainerStyle={{padding:16, alignItems: 'center'}} showsVerticalScrollIndicator={false}>
      <View style={{width: '100%', maxWidth: 800}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <Animated.View style={{transform:[{translateY:floatAnim}]}}>
            <View style={{flexDirection:'row',alignItems:'center'}}><Image source={LOGO_IMG} style={{width:36,height:24,resizeMode:'contain'}} /><Text style={{color:t.text,fontWeight:'800',fontSize:16,marginLeft:6,letterSpacing:0.5}}>MERGE</Text></View>
          </Animated.View>
          <View>
            <TouchableOpacity onPress={()=>onNav('notifications')} activeOpacity={0.7} style={{width:44,height:44,borderRadius:22,backgroundColor:t.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.border}}>
              <Text style={{fontSize:20}}>🔔</Text>
              {unreadCount>0&&<View style={{position:'absolute',top:2,right:2,backgroundColor:t.red,borderRadius:10,minWidth:18,height:18,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#fff',fontSize:9,fontWeight:'800'}}>{unreadCount>9?'9+':unreadCount}</Text></View>}
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={{opacity:fadeAnim,transform:[{translateY:slideAnim}]}}>
          <View style={{marginBottom:16}}><Text style={{fontSize:14,color:t.sub,fontWeight:'500'}}>{getGreeting(lang)}</Text><Text style={{fontSize:11,color:t.sub,marginTop:2}}>{new Date().toLocaleDateString(lang==='ar'?'ar-EG':'en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</Text></View>
          {employee?(
            <TouchableOpacity onPress={()=>onNav('profile')} activeOpacity={0.8} style={{backgroundColor:t.card,borderRadius:20,padding:20,marginBottom:16,flexDirection:'row',alignItems:'center',borderWidth:1.5,borderColor:t.skyBorder}}>
              <View style={{width:54,height:54,borderRadius:27,backgroundColor:t.sky,alignItems:'center',justifyContent:'center',marginRight:lang==='ar'?0:16,marginLeft:lang==='ar'?16:0,shadowColor:t.sky,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:10,elevation:4}}><Text style={{color:'#fff',fontWeight:'800',fontSize:20}}>{initials}</Text></View>
              <View style={{flex:1}}><Text style={{color:t.text,fontWeight:'700',fontSize:17,textAlign:lang==='ar'?'right':'left'}}>{employee.first_name} {employee.last_name}</Text><Text style={{color:t.sub,fontSize:13,marginTop:2,textAlign:lang==='ar'?'right':'left'}}>{employee.job_title||employee.position} · {employee.department}</Text></View>
              <View style={{backgroundColor:t.skyDim,paddingHorizontal:12,paddingVertical:6,borderRadius:10}}><Text style={{color:t.sky,fontSize:12,fontWeight:'700'}}>{l.profile}</Text></View>
            </TouchableOpacity>
          ):(<View style={{backgroundColor:t.card,borderRadius:20,padding:30,marginBottom:16,alignItems:'center',borderWidth:1,borderColor:t.border}}><ActivityIndicator color={t.sky} /></View>)}
          
          <View style={{backgroundColor:t.card,borderRadius:18,padding:18,marginBottom:16,borderWidth:1,borderColor:t.border}}>
            <View style={{flexDirection:'row',alignItems:'center',marginBottom:14}}>
              <View style={{width:10,height:10,borderRadius:5,backgroundColor:isClockedIn?t.green:t.sub,marginRight:10}} />
              <Text style={{fontSize:13,color:t.sub,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.6}}>{isClockedIn?l.clocked_in:l.todays_att}</Text>
              {isClockedIn&&<Badge dark={dark} label={l.active} color={t.green} />}
            </View>
            <View style={{flexDirection: IS_DESKTOP ? 'row' : 'column', gap:10}}>
              <AppBtn dark={dark} icon="✅" label={l.check_in} color={t.green} loading={checkingIn} disabled={isClockedIn} onPress={onCheckIn} style={{flex:1}} />
              <AppBtn dark={dark} icon="🚪" label={l.check_out} color={t.red} loading={checkingOut} disabled={!isClockedIn} onPress={onCheckOut} style={{flex:1}} />
            </View>
          </View>

          <Text style={{fontSize:12,fontWeight:'700',color:t.sub,textTransform:'uppercase',letterSpacing:0.8,marginBottom:12,textAlign:lang==='ar'?'right':'left'}}>{l.quick_actions}</Text>
          <View style={{flexDirection:'row', flexWrap: 'wrap', gap:10, marginBottom:10}}>
            <ActionCard dark={dark} icon="🗺️" label={l.location} color={t.sky} onPress={()=>onNav('map')} />
            <ActionCard dark={dark} icon="📊" label={l.history} color={t.green} onPress={()=>onNav('history')} />
            <ActionCard dark={dark} icon="🌴" label={l.leave} color={t.purple} onPress={()=>onNav('leave')} />
            <ActionCard dark={dark} icon="🔐" label={l.change_pw} color={t.sub} onPress={()=>onNav('change_password')} />
            <ActionCard dark={dark} icon="🏢" label={l.hr_panel} color={t.indigo} onPress={()=>onNav('hr_dashboard')} />
            <ActionCard dark={dark} icon="🚪" label={l.logout} color={t.red} onPress={()=>supabase.auth.signOut()} />
          </View>
          
          <View style={{alignItems:'center',paddingVertical:20,marginTop:10}}><Text style={{color:t.border,fontSize:10,letterSpacing:1}}>MERGE HR v2.0</Text></View>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

/* ═══════════════════ HISTORY ═══════════════════ */
const HistoryScreenComp = ({dark,employee,goBack,lang,setLang}) => {
  const t=useT_hook(dark),l=L[lang];
  const [records,setRecords]=useState([]),[loading,setLoading]=useState(true);
  useEffect(()=>{if(!employee?.id)return;(async()=>{const{data}=await supabase.from('attendance_records').select('*').eq('employee_id',employee.id).order('attendance_date',{ascending:false}).limit(60);setRecords(data||[]);setLoading(false);})();},[employee]);
  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title={l.attendance_history} onBack={goBack} lang={lang} setLang={setLang} right={<Badge dark={dark} label={`${records.length} ${l.records}`} />} />
      {loading?<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={t.sky} /></View>
        :records.length===0?<Empty dark={dark} icon="📋" title={l.no_records} sub={l.no_records_sub} />
        :<ScrollView style={{flex:1}} contentContainerStyle={{padding:16, alignItems: 'center'}} showsVerticalScrollIndicator={false}>
          <View style={{width: '100%', maxWidth: 800}}>
            {records.map((r,i)=>{const ok=r.check_in_time&&r.check_out_time,late=r.check_in_time&&r.check_in_time>'09:15:00';
              return <View key={r.id||i} style={{backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:ok?t.green+'25':t.border}}>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <Text style={{color:t.text,fontWeight:'700',fontSize:15}}>{fmtDate(r.attendance_date,lang)}</Text>
                  {ok?<Badge dark={dark} label={l.complete} color={t.green} />:r.check_in_time?<Badge dark={dark} label={l.in_progress} color={t.amber} />:<Badge dark={dark} label={l.missing} color={t.red} />}
                </View>
                <View style={{flexDirection:'row',gap:20}}>
                  <View style={{flex:1}}><Text style={{color:t.sub,fontSize:11,fontWeight:'600',textTransform:'uppercase',marginBottom:4,textAlign:lang==='ar'?'right':'left'}}>{l.check_in_label}</Text><Text style={{color:late?t.red:t.text,fontWeight:'700',fontSize:16}}>{fmtTime(r.check_in_time)}</Text></View>
                  <View style={{width:1,backgroundColor:t.border}} />
                  <View style={{flex:1}}><Text style={{color:t.sub,fontSize:11,fontWeight:'600',textTransform:'uppercase',marginBottom:4,textAlign:lang==='ar'?'right':'left'}}>{l.check_out_label}</Text><Text style={{color:t.text,fontWeight:'700',fontSize:16}}>{fmtTime(r.check_out_time)}</Text></View>
                </View></View>;})}
          </View>
        </ScrollView>}
    </ScreenWrap>
  );
};

/* ═══════════════════ MY LOCATION ═══════════════════ */
const MyLocationScreenComp = ({dark,goBack,lang,setLang}) => {
  const t=useT_hook(dark), l=L[lang];
  const [office,setOffice]=useState(null),[userLoc,setUserLoc]=useState(null),[loading,setLoading]=useState(true),[dist,setDist]=useState(null);
  const insets = useSafeAreaInsets();

  useEffect(()=>{(async()=>{
    const{data}=await supabase.from('office_location').select('*').eq('is_active',true).single();
    if(data) setOffice(data);
    if(Platform.OS!=='web'){
      try{
        let{status}=await Location.requestForegroundPermissionsAsync();
        if(status!=='granted'){setLoading(false);return;}
        let loc=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
        setUserLoc({latitude:loc.coords.latitude,longitude:loc.coords.longitude});
        if(data) setDist(haversine(loc.coords.latitude,loc.coords.longitude,data.latitude,data.longitude));
      }catch(e){console.log('Location error:',e.message);}
    }
    setLoading(false);
  })();},[]);

  if(loading) return (
    <View style={{flex:1,backgroundColor:t.bg,alignItems:'center',justifyContent:'center',paddingTop:insets.top}}>
      <ActivityIndicator size="large" color={t.sky} /><Text style={{color:t.sub,marginTop:12}}>{L[lang].loading}</Text>
    </View>
  );

  return (
    <View style={{flex:1,backgroundColor:t.bg,paddingTop:insets.top}}>
      <ScreenHeader dark={dark} title={l.my_location} onBack={goBack} lang={lang} setLang={setLang} />
      <View style={{flex:1, alignItems: 'center'}}>
        <View style={{flex:1, width: '100%', maxWidth: 1000}}>
          {Platform.OS==='web' ? (
            <View style={{flex:1,margin:16,borderRadius:16,overflow:'hidden'}}>
              {office?<iframe src={`https://maps.google.com/maps?q=${office?.latitude},${office?.longitude}&z=16&output=embed`} style={{flex:1,width:'100%',border:'none',borderRadius:16}} allowFullScreen title="Office Map" />
                :<Empty dark={dark} icon="🗺️" title="Not Available" sub="No office location configured." />}
            </View>
          ) : (
            MapView&&office?(
              <View style={{flex:1}}>
                <MapView style={{flex:1}} initialRegion={{latitude:office.latitude,longitude:office.longitude,latitudeDelta:0.01,longitudeDelta:0.01}}>
                  <Marker coordinate={{latitude:office.latitude,longitude:office.longitude}} title="Office" />
                  {Circle&&<Circle center={{latitude:office.latitude,longitude:office.longitude}} radius={office.radius_meters} strokeColor="rgba(56,189,248,0.5)" fillColor="rgba(56,189,248,0.1)" />}
                  {userLoc&&<Marker coordinate={userLoc} pinColor="green" title="You" />}
                </MapView>
                <View style={{backgroundColor:t.card,padding:16,borderTopWidth:1,borderTopColor:t.border,flexDirection:'row',justifyContent:'space-around'}}>
                  <View style={{alignItems:'center'}}><Text style={{color:t.sub,fontSize:11,fontWeight:'600'}}>{l.allowed_radius}</Text><Text style={{color:t.sky,fontSize:18,fontWeight:'800'}}>{office.radius_meters}m</Text></View>
                  <View style={{width:1,backgroundColor:t.border}} />
                  <View style={{alignItems:'center'}}><Text style={{color:t.sub,fontSize:11,fontWeight:'600'}}>{l.your_distance}</Text><Text style={{color:dist!==null?(dist<=office.radius_meters?t.green:t.red):t.sub,fontSize:18,fontWeight:'800'}}>{dist!==null?`${dist.toFixed(0)}m`:'—'}</Text></View>
                </View>
              </View>
            ):!userLoc?(
              <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:40}}>
                <Text style={{fontSize:52,marginBottom:16}}>📍</Text><Text style={{color:t.amber,fontWeight:'600',fontSize:16,marginBottom:6}}>{l.loc_denied}</Text><Text style={{color:t.sub,fontSize:14,textAlign:'center'}}>{l.loc_denied_sub}</Text>
              </View>
            ):(
              <Empty dark={dark} icon="🗺️" title="Not Available" sub="Map library not installed." />
            )
          )}
        </View>
      </View>
    </View>
  );
};

/* ═══════════════════ LEAVE REQUEST ═══════════════════ */
const LeaveRequestScreenComp = ({dark,employee,goBack,lang,setLang}) => {
  const t=useT_hook(dark),l=L[lang];
  const types=['Annual','Sick','Emergency','Personal','Maternity','Unpaid'];
  const [type,setType]=useState('Annual'),[startDate,setStartDate]=useState(''),[endDate,setEndDate]=useState(''),[reason,setReason]=useState('');
  const [submitting,setSubmitting]=useState(false),[myLeaves,setMyLeaves]=useState([]),[tab,setTab]=useState('new');
  useEffect(()=>{if(!employee?.id)return;(async()=>{const{data}=await supabase.from('leave_requests').select('*').eq('employee_id',employee.id).order('created_at',{ascending:false}).limit(20);setMyLeaves(data||[]);})();},[employee]);
  const totalDays=useMemo(()=>{if(!startDate||!endDate)return 0;const s=new Date(startDate),e=new Date(endDate);if(e<s)return 0;return Math.ceil((e-s)/86400000)+1;},[startDate,endDate]);
  const handleSubmit=async()=>{
    if(!startDate||!endDate)return Alert.alert('',l.missing_dates);
    if(totalDays<=0)return Alert.alert('',l.invalid_dates);
    if(!reason.trim())return Alert.alert('',l.missing_reason);
    setSubmitting(true);
    const{error}=await supabase.from('leave_requests').insert([{employee_id:employee.id,leave_type:type,start_date:startDate,end_date:endDate,total_days:totalDays,reason:reason.trim(),status:'pending'}]);
    setSubmitting(false);
    if(error){Alert.alert('Error',error.message);return;}
    Alert.alert(l.submitted,`${l.submitted_msg} ${totalDays} ${totalDays>1?l.days:l.day}.`,async()=>{setStartDate('');setEndDate('');setReason('');const{data}=await supabase.from('leave_requests').select('*').eq('employee_id',employee.id).order('created_at',{ascending:false}).limit(20);setMyLeaves(data||[]);setTab('history');});
  };
  const sc=s=>s==='approved'?t.green:s==='rejected'?t.red:t.amber;
  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title={l.leave_request} onBack={goBack} lang={lang} setLang={setLang} />
      <View style={{alignItems: 'center', flex: 1}}>
        <View style={{width: '100%', maxWidth: 800, flex: 1}}>
          <View style={{flexDirection:'row',marginHorizontal:16,marginTop: 16, marginBottom:12,backgroundColor:t.surface,borderRadius:12,padding:4}}>
            {[['new',l.new_request],['history',l.my_leaves]].map(([k,v])=>(<TouchableOpacity key={k} onPress={()=>setTab(k)} style={{flex:1,paddingVertical:10,borderRadius:10,alignItems:'center',backgroundColor:tab===k?t.card:'transparent',shadowColor:tab===k?'#000':'transparent',shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:8,elevation:tab===k?2:0}}>
              <Text style={{color:tab===k?t.sky:t.sub,fontWeight:'700',fontSize:13}}>{v}</Text></TouchableOpacity>))}
          </View>
          {tab==='new'?(
            <ScrollView style={{flex:1,paddingHorizontal:16}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{color:t.sub,fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8,textAlign:lang==='ar'?'right':'left'}}>{l.leave_type}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:18}}>
                {types.map(lt=>(<TouchableOpacity key={lt} onPress={()=>setType(lt)} style={{paddingHorizontal:16,paddingVertical:9,borderRadius:20,marginRight:8,backgroundColor:type===lt?t.sky:t.card,borderWidth:1.5,borderColor:type===lt?t.sky:t.border}}>
                  <Text style={{color:type===lt?'#fff':t.sub,fontWeight:'700',fontSize:13}}>{lt}</Text></TouchableOpacity>))}
              </ScrollView>
              <View style={{flexDirection: IS_DESKTOP ? 'row' : 'column', gap:10, marginBottom:12}}>
                <View style={{flex:1}}><Text style={{color:t.sub,fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8,textAlign:lang==='ar'?'right':'left'}}>{l.start_date}</Text><CalendarPicker dark={dark} value={startDate} onChange={setStartDate} lang={lang} /></View>
                <View style={{flex:1}}><Text style={{color:t.sub,fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8,textAlign:lang==='ar'?'right':'left'}}>{l.end_date}</Text><CalendarPicker dark={dark} value={endDate} onChange={setEndDate} lang={lang} /></View>
              </View>
              {totalDays>0&&<View style={{backgroundColor:t.green+'10',borderWidth:1.5,borderColor:t.green+'25',borderRadius:12,padding:12,marginBottom:12,alignItems:'center'}}><Text style={{color:t.green,fontWeight:'700',fontSize:15}}>{totalDays} {totalDays>1?l.days:l.day}</Text></View>}
              <Text style={{color:t.sub,fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8,textAlign:lang==='ar'?'right':'left'}}>{l.reason}</Text>
              <TextInput style={{height:110,backgroundColor:t.inputBg,borderRadius:12,paddingHorizontal:14,paddingTop:14,color:t.text,fontSize:14,fontWeight:'500',borderWidth:1.5,borderColor:t.border,textAlignVertical:'top',textAlign:lang==='ar'?'right':'left'}}
                placeholder={l.describe_reason} placeholderTextColor="#8BA0B8" value={reason} onChangeText={setReason} multiline numberOfLines={4} />
              <AppBtn dark={dark} label={l.submit_request} icon="📤" color={t.sky} loading={submitting} onPress={handleSubmit} style={{marginTop:20,marginBottom:30}} />
            </ScrollView>
          ):(
            <ScrollView style={{flex:1,paddingHorizontal:16}} showsVerticalScrollIndicator={false}>
              {myLeaves.length===0?<Empty dark={dark} icon="🌴" title={l.no_leaves} sub={l.no_leaves_sub} />
                :myLeaves.map((lv,i)=>(<View key={lv.id||i} style={{backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:t.border}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><Text style={{color:t.text,fontWeight:'700',fontSize:15}}>{lv.leave_type} {l.leave}</Text><Badge dark={dark} label={lv.status?.toUpperCase()} color={sc(lv.status)} /></View>
                  <Text style={{color:t.sub,fontSize:13}}>{fmtDate(lv.start_date,lang)} — {fmtDate(lv.end_date,lang)} · {lv.total_days} {lv.total_days>1?l.days:l.day}</Text>
                  {lv.reason&&<Text style={{color:t.sub,fontSize:12,marginTop:6,fontStyle:'italic',textAlign:lang==='ar'?'right':'left'}}>"{lv.reason}"</Text>}</View>))}
            </ScrollView>
          )}
        </View>
      </View>
    </ScreenWrap>
  );
};

/* ═══════════════════ NOTIFICATIONS ═══════════════════ */
const NotificationsScreenComp = ({dark,employee,goBack,onRead,lang,setLang}) => {
  const t=useT_hook(dark),l=L[lang];
  const [notifs,setNotifs]=useState([]),[loading,setLoading]=useState(true);
  const fetchN=async()=>{if(!employee?.id)return;const{data}=await supabase.from('notifications').select('*').or(`employee_id.eq.${employee.id},employee_id.is.null`).order('created_at',{ascending:false}).limit(50);setNotifs(data||[]);setLoading(false);};
  useEffect(()=>{fetchN();},[employee]);
  const markRead=async id=>{await supabase.from('notifications').update({is_read:true}).eq('id',id);setNotifs(p=>p.map(n=>n.id===id?{...n,is_read:true}:n));onRead?.();};
  const tc=type=>type==='leave'?t.purple:type==='attendance'?t.green:t.sky;
  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title={l.notifications} onBack={goBack} lang={lang} setLang={setLang}
        right={notifs.filter(n=>!n.is_read).length>0?<TouchableOpacity onPress={async()=>{const ur=notifs.filter(n=>!n.is_read);for(const u of ur)await supabase.from('notifications').update({is_read:true}).eq('id',u.id);setNotifs(p=>p.map(n=>({...n,is_read:true})));onRead?.();}}
          style={{paddingHorizontal:10,paddingVertical:6,borderRadius:8,backgroundColor:t.skyDim}}><Text style={{color:t.sky,fontSize:11,fontWeight:'700'}}>{l.mark_all_read}</Text></TouchableOpacity>:null} />
      {loading?<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={t.sky} /></View>
        :notifs.length===0?<Empty dark={dark} icon="🔕" title={l.no_notifs} sub={l.no_notifs_sub} />
        :<ScrollView style={{flex:1}} contentContainerStyle={{padding:16, alignItems: 'center'}} showsVerticalScrollIndicator={false}>
          <View style={{width: '100%', maxWidth: 800}}>
            {notifs.map((n,i)=>(<TouchableOpacity key={n.id||i} onPress={()=>!n.is_read&&markRead(n.id)} activeOpacity={0.7} style={{backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:n.is_read?t.border:t.skyBorder,flexDirection:'row'}}>
              {!n.is_read&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:t.sky,marginHorizontal:12,marginTop:6}} />}
              <View style={{flex:1}}>
                <View style={{flexDirection:'row',alignItems:'center',marginBottom:6,gap:8}}><Badge dark={dark} label={n.type||'INFO'} color={tc(n.type)} /><Text style={{color:t.sub,fontSize:11}}>{n.created_at?new Date(n.created_at).toLocaleDateString():''}</Text></View>
                <Text style={{color:t.text,fontSize:14,fontWeight:'600',lineHeight:20,textAlign:lang==='ar'?'right':'left'}}>{n.title||n.message||'Notification'}</Text>
                {n.message&&n.title&&<Text style={{color:t.sub,fontSize:13,marginTop:4,lineHeight:18,textAlign:lang==='ar'?'right':'left'}}>{n.message}</Text>}</View></TouchableOpacity>))}
          </View>
        </ScrollView>}
    </ScreenWrap>
  );
};

/* ═══════════════════ PROFILE ═══════════════════ */
const ProfileScreenComp = ({dark,employee,goBack,setDarkMode,onChangePassword,lang,setLang}) => {
  const t=useT_hook(dark),l=L[lang];
  const initials=employee?(employee.first_name?.[0]||'')+(employee.last_name?.[0]||''):'??';
  const [stats,setStats]=useState({days:0,month:0,onTime:0}),[leaves,setLeaves]=useState([]);
  useEffect(()=>{if(!employee?.id)return;(async()=>{
    const{data:recs}=await supabase.from('attendance_records').select('*').eq('employee_id',employee.id);
    const done=(recs||[]).filter(r=>r.check_in_time&&r.check_out_time);const ot=done.filter(r=>r.check_in_time<='09:15:00');
    const mo=done.filter(r=>{const d=new Date(r.attendance_date),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();});
    setStats({days:done.length,month:mo.length,onTime:ot.length});
    const{data:lv}=await supabase.from('leave_requests').select('*').eq('employee_id',employee.id).order('created_at',{ascending:false}).limit(10);setLeaves(lv||[]);
  })();},[employee]);
  const sc=s=>s==='approved'?t.green:s==='rejected'?t.red:t.amber;
  return (
    <ScreenWrap dark={dark}>
      <ScreenHeader dark={dark} title={l.my_profile} onBack={goBack} lang={lang} setLang={setLang} />
      <ScrollView style={{flex:1}} contentContainerStyle={{alignItems: 'center'}} showsVerticalScrollIndicator={false}>
        <View style={{width: '100%', maxWidth: 800}}>
          <View style={{alignItems:'center',paddingVertical:24,paddingHorizontal:16}}>
            <View style={{width:96,height:96,borderRadius:48,backgroundColor:t.sky,alignItems:'center',justifyContent:'center',shadowColor:t.sky,shadowOffset:{width:0,height:8},shadowOpacity:0.35,shadowRadius:20,elevation:6}}><Text style={{color:'#fff',fontWeight:'900',fontSize:36}}>{initials}</Text></View>
            <Text style={{color:t.text,fontWeight:'800',fontSize:22,marginTop:14}}>{employee?.first_name} {employee?.last_name}</Text>
            <Text style={{color:t.sub,fontSize:14,marginTop:4}}>{employee?.job_title||employee?.position}</Text>
            <View style={{marginTop:10,paddingHorizontal:14,paddingVertical:6,borderRadius:10,backgroundColor:t.skyDim,borderWidth:1,borderColor:t.skyBorder}}><Text style={{color:t.sky,fontWeight:'700',fontSize:12}}>{employee?.department}</Text></View>
          </View>
          <View style={{flexDirection:'row',gap:10,paddingHorizontal:16,marginBottom:20}}>
            <StatBox dark={dark} value={stats.days} label={l.total_days} color={t.sky} />
            <StatBox dark={dark} value={stats.month} label={l.this_month} color={t.green} />
            <StatBox dark={dark} value={`${stats.days>0?Math.round(stats.onTime/stats.days*100):0}%`} label={l.on_time} color={t.amber} /></View>
          <View style={{backgroundColor:t.card,borderRadius:16,padding:4,marginHorizontal:16,marginBottom:16,borderWidth:1,borderColor:t.border}}>
            <InfoRow dark={dark} label={l.email} value={employee?.email} lang={lang} /><InfoRow dark={dark} label={l.phone} value={employee?.phone} lang={lang} /><InfoRow dark={dark} label={l.position} value={employee?.position} lang={lang} /><InfoRow dark={dark} label={l.department} value={employee?.department} lang={lang} /><InfoRow dark={dark} label={l.joined} value={employee?.hire_date?fmtDate(employee.hire_date,lang):'—'} lang={lang} /></View>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:t.card,borderRadius:14,padding:16,marginHorizontal:16,marginBottom:16,borderWidth:1,borderColor:t.border}}>
            <View style={{flexDirection:'row',alignItems:'center'}}><Text style={{fontSize:20,marginRight:12}}>🌓</Text><Text style={{color:t.text,fontWeight:'600'}}>{dark?l.dark_mode:l.light_mode}</Text></View>
            <Switch value={dark} onValueChange={setDarkMode} trackColor={{false:t.border,true:t.sky}} thumbColor="#fff" /></View>
          <TouchableOpacity onPress={onChangePassword} activeOpacity={0.7} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:t.card,borderRadius:14,padding:16,marginHorizontal:16,marginBottom:30,borderWidth:1,borderColor:t.border}}>
            <View style={{flexDirection:'row',alignItems:'center'}}><Text style={{fontSize:20,marginRight:12}}>🔐</Text><Text style={{color:t.text,fontWeight:'600'}}>{l.change_password}</Text></View>
            <Text style={{color:t.sub,fontSize:18}}>›</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrap>
  );
};

/* ═══════════════════ MAIN APP ═══════════════════ */
export default function App() {
  const [session, setSession] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState('en');
  const [screen, setScreen] = useState('home');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchEmployee(session.user.id);
      else setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchEmployee(session.user.id);
      else { setEmployee(null); setLoading(false); setScreen('home'); }
    });
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const d = await AsyncStorage.getItem('darkMode');
    const l = await AsyncStorage.getItem('lang');
    if (d !== null) setDark(d === 'true');
    if (l !== null) setLang(l);
  };

  const fetchEmployee = async (uid) => {
    const { data } = await supabase.from('employees').select('*').eq('auth_id', uid).single();
    if (data) {
      setEmployee(data);
      checkTodayAttendance(data.id);
      fetchUnreadCount(data.id);
    }
    setLoading(false);
  };

  const checkTodayAttendance = async (eid) => {
    const { data } = await supabase.from('attendance_records').select('*').eq('employee_id', eid).eq('attendance_date', nowISO()).single();
    if (data && data.check_in_time && !data.check_out_time) setIsClockedIn(true);
    else setIsClockedIn(false);
  };

  const fetchUnreadCount = async (eid) => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).or(`employee_id.eq.${eid},employee_id.is.null`).eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const handleCheckIn = async () => {
    if (!employee) return;
    setCheckingIn(true);
    try {
      const { data: office } = await supabase.from('office_location').select('*').eq('is_active', true).single();
      if (!office) throw new Error('Office location not configured.');
      
      let uLat, uLon;
      if (Platform.OS !== 'web') {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error(L[lang].loc_denied);
        let loc = await Location.getCurrentPositionAsync({});
        uLat = loc.coords.latitude; uLon = loc.coords.longitude;
      } else {
        // Simple mock for web if needed, or use browser geolocation
        uLat = office.latitude; uLon = office.longitude;
      }

      const d = haversine(uLat, uLon, office.latitude, office.longitude);
      if (d > office.radius_meters) {
        Alert.alert(L[lang].out_of_range, `${L[lang].your_distance}: ${d.toFixed(0)}m. ${L[lang].allowed_radius}: ${office.radius_meters}m.`);
        setCheckingIn(false); return;
      }

      const { error } = await supabase.from('attendance_records').insert([{
        employee_id: employee.id, attendance_date: nowISO(), check_in_time: nowTime(), check_in_lat: uLat, check_in_lon: uLon, status: 'present'
      }]);
      if (error) throw error;
      setIsClockedIn(true);
      Alert.alert(L[lang].checked_in);
    } catch (e) { Alert.alert('Error', e.message); }
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    if (!employee) return;
    setCheckingOut(true);
    try {
      const { data: rec } = await supabase.from('attendance_records').select('*').eq('employee_id', employee.id).eq('attendance_date', nowISO()).single();
      if (!rec) throw new Error(L[lang].not_checked_in);
      const { error } = await supabase.from('attendance_records').update({ check_out_time: nowTime() }).eq('id', rec.id);
      if (error) throw error;
      setIsClockedIn(false);
      Alert.alert(L[lang].checked_out);
    } catch (e) { Alert.alert('Error', e.message); }
    setCheckingOut(false);
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: dark ? '#0B1120' : '#F0F7FF' }}><ActivityIndicator size="large" color="#38BDF8" /></View>;
  if (!session) return <SafeAreaProvider><LoginScreen lang={lang} setLang={(l) => { setLang(l); AsyncStorage.setItem('lang', l); }} /></SafeAreaProvider>;

  const renderScreen = () => {
    switch (screen) {
      case 'history': return <HistoryScreenComp dark={dark} employee={employee} goBack={() => setScreen('home')} lang={lang} setLang={setLang} />;
      case 'map': return <MyLocationScreenComp dark={dark} goBack={() => setScreen('home')} lang={lang} setLang={setLang} />;
      case 'leave': return <LeaveRequestScreenComp dark={dark} employee={employee} goBack={() => setScreen('home')} lang={lang} setLang={setLang} />;
      case 'notifications': return <NotificationsScreenComp dark={dark} employee={employee} goBack={() => setScreen('home')} onRead={() => fetchUnreadCount(employee.id)} lang={lang} setLang={setLang} />;
      case 'profile': return <ProfileScreenComp dark={dark} employee={employee} goBack={() => setScreen('home')} setDarkMode={(v) => { setDark(v); AsyncStorage.setItem('darkMode', String(v)); }} onChangePassword={() => setScreen('change_password')} lang={lang} setLang={setLang} />;
      default: return <HomeScreen dark={dark} employee={employee} isClockedIn={isClockedIn} checkingIn={checkingIn} checkingOut={checkingOut} unreadCount={unreadCount} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} onNav={setScreen} lang={lang} setLang={setLang} />;
    }
  };

  return <SafeAreaProvider><ScreenWrap dark={dark}>{renderScreen()}</ScreenWrap></SafeAreaProvider>;
}
