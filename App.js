import {
  Text, View, TextInput, Alert, ActivityIndicator,
  TouchableOpacity, Animated, ScrollView,
  KeyboardAvoidingView, Platform, Switch, Modal,
  FlatList, Dimensions, StatusBar, RefreshControl,
} from 'react-native';
import { useState, useEffect, useRef, useCallback, useMemo, Component } from 'react';
import { supabase } from './supabase';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const IS_SMALL = SCREEN_W < 380;

/* ═══════════════════ OPTIONAL NATIVE MODULES ═══════════════════ */
let MapView = null, Marker = null, Circle = null;
if (Platform.OS !== 'web') {
  try {
    const m = require('react-native-maps');
    MapView = m.default; Marker = m.Marker; Circle = m.Circle;
  } catch (_) {}
}
let Location = null;
try { Location = require('expo-location'); } catch (_) {}
let LocalAuthentication = null;
try { LocalAuthentication = require('expo-local-authentication'); } catch (_) {}
  
/* ═══════════════════ ERROR BOUNDARY ═══════════════════ */
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      const dark = this.props.dark;
      const lang = this.props.lang || 'en';
      const bgColor = dark ? '#080E1C' : '#EEF5FF';
      const cardColor = dark ? '#0F1A2E' : '#FFFFFF';
      const textColor = dark ? '#F0F6FF' : '#07101E';
      const subColor = dark ? '#6E8CAD' : '#506A84';
      const skyColor = '#38BDF8';
      return (
        <View style={{
          flex: 1, backgroundColor: bgColor,
          alignItems: 'center', justifyContent: 'center', padding: 32,
        }}>
          <View style={{
            backgroundColor: cardColor, borderRadius: 24, padding: 32,
            alignItems: 'center', width: '100%', maxWidth: 380,
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
          }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>⚠️</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, marginBottom: 8, textAlign: 'center' }}>
              {lang === 'ar' ? 'حدث خطأ غير متوقع' : 'Something Went Wrong'}
            </Text>
            <Text style={{ fontSize: 14, color: subColor, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
              {lang === 'ar'
                ? 'حدث خطأ أثناء تحميل هذه الصفحة. حاول مرة أخرى.'
                : 'An error occurred while loading this screen. Please try again.'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              style={{
                backgroundColor: skyColor, borderRadius: 14,
                paddingHorizontal: 32, paddingVertical: 14,
                shadowColor: skyColor, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {lang === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

/* ═══════════════════ CONNECTIVITY HOOK ═══════════════════ */
const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsConnected(navigator.onLine);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    let NetInfo;
    try { NetInfo = require('@react-native-community/netinfo'); } catch (_) {}
    if (NetInfo) {
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsConnected(state.isConnected && state.isInternetReachable !== false);
      });
      return () => unsubscribe();
    }
  }, []);
  return isConnected;
};

/* ═══════════════════ OFFLINE BANNER ═══════════════════ */
const OfflineBanner = ({ dark, lang }) => {
  const t = useT(dark);
  return (
    <View style={{
      backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <Text style={{ fontSize: 16 }}>📡</Text>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
        {lang === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection'}
      </Text>
    </View>
  );
};

/* ═══════════════════ SHADOW HELPER ═══════════════════ */
const shadow = (size = 'md') => {
  const s = {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 10, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 20, elevation: 8 },
    xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 14 },
  };
  return s[size] || s.md;
};

/* ═══════════════════ THEME ═══════════════════ */
const TH = {
  dark: {
    bg: '#080E1C', card: '#0F1A2E', surface: '#14213D', border: '#1C2E47',
    text: '#F0F6FF', sub: '#6E8CAD', muted: '#3E5470',
    sky: '#38BDF8', skyDim: 'rgba(56,189,248,0.10)', skyBorder: 'rgba(56,189,248,0.22)',
    green: '#22C55E', greenDim: 'rgba(34,197,94,0.10)',
    red: '#EF4444', redDim: 'rgba(239,68,68,0.10)',
    amber: '#F59E0B', amberDim: 'rgba(245,158,11,0.10)',
    purple: '#A855F7', purpleDim: 'rgba(168,85,247,0.10)',
    indigo: '#6366F1', indigoDim: 'rgba(99,102,241,0.10)',
    inputBg: '#060B16',
  },
  light: {
    bg: '#EEF5FF', card: '#FFFFFF', surface: '#E3EDF8', border: '#D1E0F0',
    text: '#07101E', sub: '#506A84', muted: '#8FA8C0',
    sky: '#0284C7', skyDim: 'rgba(2,132,199,0.07)', skyBorder: 'rgba(2,132,199,0.16)',
    green: '#15803D', greenDim: 'rgba(21,128,61,0.07)',
    red: '#DC2626', redDim: 'rgba(220,38,38,0.07)',
    amber: '#B45309', amberDim: 'rgba(180,83,9,0.07)',
    purple: '#7C3AED', purpleDim: 'rgba(124,58,237,0.07)',
    indigo: '#4338CA', indigoDim: 'rgba(67,56,202,0.07)',
    inputBg: '#F5FAFF',
  },
};
const useT = (d) => TH[d ? 'dark' : 'light'];

/* ═══════════════════ MERGE LOGO COMPONENT ═══════════════════ */
const MergeLogo = ({ size = 'md', dark }) => {
  const sizes = {
    sm: { boxW: 38, boxH: 26, fontSize: 14, barH: 3, gap: 2 },
    md: { boxW: 64, boxH: 64, fontSize: 11, barH: 4, gap: 3 },
    lg: { boxW: 160, boxH: 100, fontSize: 18, barH: 6, gap: 4 },
  };
  const s = sizes[size] || sizes.md;
  const skyColor = dark ? '#38BDF8' : '#0284C7';
  const greenColor = dark ? '#22C55E' : '#15803D';

  if (size === 'sm') {
    return (
      <View style={{
        width: s.boxW, height: s.boxH,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      }}>
        <View style={{
          width: 22, height: 22, borderRadius: 6,
          backgroundColor: skyColor, alignItems: 'center', justifyContent: 'center',
          shadowColor: skyColor, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
        }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: -1 }}>M</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Icon block */}
      <View style={{
        width: s.boxW, height: size === 'lg' ? 70 : s.boxH,
        borderRadius: size === 'lg' ? 20 : 16,
        backgroundColor: skyColor,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: skyColor, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
        marginBottom: size === 'lg' ? 12 : 6,
      }}>
        {/* Abstract bars inside the logo block */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: s.gap + 1 }}>
          {[0.5, 0.8, 1, 0.7, 0.55].map((h, i) => (
            <View key={i} style={{
              width: size === 'lg' ? 12 : (size === 'md' ? 6 : 4),
              height: (size === 'lg' ? 40 : (size === 'md' ? 28 : 14)) * h,
              borderRadius: size === 'lg' ? 4 : 2,
              backgroundColor: i === 2 ? '#fff' : 'rgba(255,255,255,0.55)',
            }} />
          ))}
        </View>
      </View>
      {/* Brand Text */}
      {size === 'lg' && (
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 32, fontWeight: '900', letterSpacing: 6,
            color: dark ? '#F0F6FF' : '#07101E',
          }}>MERGE</Text>
          <View style={{
            width: 60, height: 3, borderRadius: 2,
            backgroundColor: greenColor, marginTop: 6,
          }} />
        </View>
      )}
    </View>
  );
};

/* ═══════════════════ i18n ═══════════════════ */
const L = {
  en: {
    welcome_back: 'Welcome Back', sign_in_sub: 'Sign in to your employee account',
    email: 'Email Address', password: 'Password', sign_in: 'Sign In',
    enter_email: 'name@company.com', enter_pw: 'Enter your password',
    forgot_pw: 'Forgot Password?', reset_title: 'Reset Password', reset_sub: 'Enter your email to receive a reset link.',
    reset_sent: 'Reset Link Sent', reset_sent_msg: 'Check your email for the password reset link.',
    good_morning: 'Good Morning', good_afternoon: 'Good Afternoon', good_evening: 'Good Evening',
    clocked_in: 'Currently Clocked In', todays_att: "Today's Attendance",
    check_in: 'Check In', check_out: 'Check Out', active: 'ACTIVE',
    quick_actions: 'Quick Actions', location: 'Location', history: 'History',
    leave: 'Leave', change_pw: 'Password', hr_panel: 'HR Panel', logout: 'Logout', profile: 'Profile ›',
    attendance_history: 'Attendance History', records: 'records',
    complete: 'COMPLETE', in_progress: 'IN PROGRESS', missing: 'MISSING',
    check_in_label: 'Check In', check_out_label: 'Check Out',
    no_records: 'No Records', no_records_sub: 'Your attendance history will appear here after your first check-in.',
    my_location: 'My Location', office_info: 'Office Info', allowed_radius: 'Allowed Radius', your_distance: 'Your Distance',
    loc_denied: 'Location Access Denied', loc_denied_sub: 'Enable location permissions to see your position.',
    leave_request: 'Leave Request', new_request: 'New Request', my_leaves: 'My Leaves',
    leave_type: 'Leave Type', start_date: 'Start Date', end_date: 'End Date',
    reason: 'Reason', describe_reason: 'Describe your reason...', submit_request: 'Submit Request',
    day: 'Day', days: 'Days', invalid_dates: 'End date must be after start date.',
    missing_dates: 'Please select start and end dates.', missing_reason: 'Please provide a reason.',
    submitted: 'Submitted ✓', submitted_msg: 'Your leave request has been submitted.',
    no_leaves: 'No Leave Requests', no_leaves_sub: "You haven't submitted any leave requests yet.",
    notifications: 'Notifications', mark_all_read: 'Mark All Read',
    no_notifs: 'No Notifications', no_notifs_sub: "You're all caught up.",
    my_profile: 'My Profile', total_days: 'Total Days', this_month: 'This Month', on_time: 'On Time',
    phone: 'Phone', position: 'Position', department: 'Department', joined: 'Joined',
    dark_mode: 'Dark Mode', light_mode: 'Light Mode', change_password: 'Change Password',
    recent_leaves: 'Recent Leave Requests',
    current_pw: 'Current Password', new_pw: 'New Password', confirm_pw: 'Confirm New Password',
    update_pw: 'Update Password', weak_pw: 'Password must be at least 6 characters.',
    mismatch: 'Passwords do not match.', pw_success: 'Password changed successfully.', pw_hint: 'Use a strong password with at least 6 characters.',
    hr_dashboard: 'HR Dashboard', overview: 'Overview', attendance_tab: 'Attendance',
    leaves_tab: 'Leaves', employees_tab: 'Employees', notifs_tab: 'Notifications', export_tab: 'Export',
    total_employees: 'Total Employees', present: 'Present', absent: 'Absent', pending_leaves: 'Pending Leaves',
    quick_actions_hr: 'Quick Actions', review_att: 'Review Attendance', leave_req: 'Leave Requests',
    emp_list: 'Employee List', send_notif: 'Send Notification',
    latest_att: 'Latest Attendance', no_att_today: 'No attendance recorded today.',
    att_records: 'Attendance Records', entry: 'Entry', exit: 'Exit',
    leave_reqs: 'Leave Requests', under_review: 'Under Review', approve: 'Approve', reject: 'Reject',
    emp_list_title: 'Employee List', search_emp: 'Search by name or code...', active_st: 'Active', inactive_st: 'Inactive',
    send_notif_title: 'Send Notification', notif_type: 'Notification Type',
    announcement: 'Announcement', reminder: 'Reminder', alert: 'Alert',
    notif_text: 'Notification Text', write_text: 'Write notification text here...',
    send_all: 'Send to All', will_send_to: 'Will be sent to', employee_word: 'employees',
    select_type: 'Select Data Type', from_date: 'From Date', to_date: 'To Date',
    generate_download: 'Generate & Download', loading: 'Loading...',
    back: 'Back', not_available: 'Not Available',
    out_of_range: 'Out of Range', already_in: 'Already Checked In', not_checked_in: 'Not Checked In',
    already_out: 'Already Checked Out', checked_in: 'Checked In ✓', checked_out: 'Checked Out ✓',
    loc_error: 'Location Error', enable_gps: 'Please enable GPS and try again.',
    cancel: 'Cancel', pick_date: 'Pick Date',
    no_internet: 'No Internet Connection', no_internet_sub: 'Please check your connection and try again.',
    logout_confirm: 'Are you sure you want to logout?', logout_title: 'Confirm Logout',
    yes: 'Yes', no: 'No',
    biometric_prompt: 'Verify your identity to check in',
    biometric_fail: 'Biometric verification failed. Please try again.',
    past_date_error: 'Cannot select a date in the past.',
    session_expired: 'Session Expired', session_expired_msg: 'Your session has expired. Please sign in again.',
    su: 'Su', mo: 'Mo', tu: 'Tu', we: 'We', th: 'Th', fr: 'Fr', sa: 'Sa',
    jan: 'January', feb: 'February', mar: 'March', apr: 'April', may: 'May', jun: 'June',
    jul: 'July', aug: 'August', sep: 'September', oct: 'October', nov: 'November', dec: 'December',
  },
  ar: {
    welcome_back: 'مرحباً بعودتك', sign_in_sub: 'سجّل الدخول إلى حسابك',
    email: 'البريد الإلكتروني', password: 'كلمة المرور', sign_in: 'تسجيل الدخول',
    enter_email: 'name@company.com', enter_pw: 'أدخل كلمة المرور',
    forgot_pw: 'نسيت كلمة المرور؟', reset_title: 'إعادة تعيين كلمة المرور', reset_sub: 'أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين.',
    reset_sent: 'تم إرسال الرابط', reset_sent_msg: 'تحقق من بريدك الإلكتروني لرابط إعادة التعيين.',
    good_morning: 'صباح الخير', good_afternoon: 'مساء الخير', good_evening: 'مساء الخير',
    clocked_in: 'مسجّل دخول حالياً', todays_att: 'حضور اليوم',
    check_in: 'تسجيل دخول', check_out: 'تسجيل خروج', active: 'نشط',
    quick_actions: 'إجراءات سريعة', location: 'الموقع', history: 'السجل',
    leave: 'إجازة', change_pw: 'كلمة المرور', hr_panel: 'لوحة التحكم', logout: 'تسجيل خروج', profile: 'الملف الشخصي ›',
    attendance_history: 'سجل الحضور', records: 'سجل',
    complete: 'مكتمل', in_progress: 'قيد العمل', missing: 'مفقود',
    check_in_label: 'دخول', check_out_label: 'خروج',
    no_records: 'لا توجد سجلات', no_records_sub: 'سيظهر سجل حضورك هنا بعد أول تسجيل دخول.',
    my_location: 'موقعي', office_info: 'معلومات المكتب', allowed_radius: 'نطاق مسموح', your_distance: 'المسافة الحالية',
    loc_denied: 'تم رفض الوصول للموقع', loc_denied_sub: 'فعّل أذونات الموقع لرؤية موقعك.',
    leave_request: 'طلب إجازة', new_request: 'طلب جديد', my_leaves: 'إجازاتي',
    leave_type: 'نوع الإجازة', start_date: 'تاريخ البداية', end_date: 'تاريخ النهاية',
    reason: 'السبب', describe_reason: 'اكتب السبب هنا...', submit_request: 'إرسال الطلب',
    day: 'يوم', days: 'أيام', invalid_dates: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية.',
    missing_dates: 'الرجاء اختيار تاريخ البداية والنهاية.', missing_reason: 'الرجاء كتابة السبب.',
    submitted: 'تم الإرسال ✓', submitted_msg: 'تم إرسال طلب الإجازة بنجاح.',
    no_leaves: 'لا توجد طلبات إجازة', no_leaves_sub: 'لم تقدم أي طلبات إجازة بعد.',
    notifications: 'الإشعارات', mark_all_read: 'قراءة الكل',
    no_notifs: 'لا توجد إشعارات', no_notifs_sub: 'ليس لديك إشعارات جديدة.',
    my_profile: 'ملفي الشخصي', total_days: 'إجمالي الأيام', this_month: 'هذا الشهر', on_time: 'في الوقت',
    phone: 'الهاتف', position: 'المنصب', department: 'القسم', joined: 'تاريخ الانضمام',
    dark_mode: 'الوضع الداكن', light_mode: 'الوضع الفاتح', change_password: 'تغيير كلمة المرور',
    recent_leaves: 'طلبات الإجازة الأخيرة',
    current_pw: 'كلمة المرور الحالية', new_pw: 'كلمة المرور الجديدة', confirm_pw: 'تأكيد كلمة المرور',
    update_pw: 'تحديث كلمة المرور', weak_pw: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    mismatch: 'كلمات المرور غير متطابقة.', pw_success: 'تم تغيير كلمة المرور بنجاح.', pw_hint: 'استخدم كلمة مرور قوية من 6 أحرف على الأقل.',
    hr_dashboard: 'لوحة التحكم', overview: 'نظرة عامة', attendance_tab: 'الحضور',
    leaves_tab: 'الإجازات', employees_tab: 'الموظفين', notifs_tab: 'إشعارات', export_tab: 'تصدير',
    total_employees: 'إجمالي الموظفين', present: 'حاضر', absent: 'غائب', pending_leaves: 'طلبات معلقة',
    quick_actions_hr: 'إجراءات سريعة', review_att: 'مراجعة الحضور', leave_req: 'طلبات الإجازة',
    emp_list: 'قائمة الموظفين', send_notif: 'إرسال إشعار',
    latest_att: 'آخر سجلات الحضور', no_att_today: 'لا يوجد حضور مسجل اليوم.',
    att_records: 'سجلات الحضور', entry: 'دخول', exit: 'خروج',
    leave_reqs: 'طلبات الإجازة', under_review: 'قيد المراجعة', approve: 'موافقة', reject: 'رفض',
    emp_list_title: 'قائمة الموظفين', search_emp: 'ابحث بالاسم أو الكود...', active_st: 'نشط', inactive_st: 'غير نشط',
    send_notif_title: 'إرسال إشعار', notif_type: 'نوع الإشعار',
    announcement: 'إعلان', reminder: 'تذكير', alert: 'تنبيه',
    notif_text: 'نص الإشعار', write_text: 'اكتب نص الإشعار هنا...',
    send_all: 'إرسال للجميع', will_send_to: 'سيتم الإرسال إلى', employee_word: 'موظف',
    select_type: 'اختر نوع البيانات', from_date: 'من تاريخ', to_date: 'إلى تاريخ',
    generate_download: 'إنشاء وتحميل', loading: 'جاري التحميل...',
    back: 'رجوع', not_available: 'غير متاح',
    out_of_range: 'خارج النطاق', already_in: 'مسجّل دخول بالفعل', not_checked_in: 'لم تسجّل دخول',
    already_out: 'مسجّل خروج بالفعل', checked_in: 'تم تسجيل الدخول ✓', checked_out: 'تم تسجيل الخروج ✓',
    loc_error: 'خطأ في الموقع', enable_gps: 'يرجى تفعيل GPS والمحاولة مرة أخرى.',
    cancel: 'إلغاء', pick_date: 'اختر التاريخ',
    no_internet: 'لا يوجد اتصال بالإنترنت', no_internet_sub: 'يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
    logout_confirm: 'هل أنت متأكد أنك تريد تسجيل الخروج؟', logout_title: 'تأكيد تسجيل الخروج',
    yes: 'نعم', no: 'لا',
    biometric_prompt: 'تحقق من هويتك لتسجيل الدخول',
    biometric_fail: 'فشل التحقق البيومتري. حاول مرة أخرى.',
    past_date_error: 'لا يمكن اختيار تاريخ في الماضي.',
    session_expired: 'انتهت الجلسة', session_expired_msg: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
    su: 'أح', mo: 'إث', tu: 'ثل', we: 'أر', th: 'خم', fr: 'جم', sa: 'سب',
    jan: 'يناير', feb: 'فبراير', mar: 'مارس', apr: 'أبريل', may: 'مايو', jun: 'يونيو',
    jul: 'يوليو', aug: 'أغسطس', sep: 'سبتمبر', oct: 'أكتوبر', nov: 'نوفمبر', dec: 'ديسمبر',
  },
};

/* ═══════════════════ UTILITIES ═══════════════════ */
const haversine = (a, b, c, d) => {
  const R = 6371000, r = x => x * Math.PI / 180, dl = r(c - a), dn = r(d - b);
  return R * 2 * Math.atan2(
    Math.sqrt(Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2),
    Math.sqrt(1 - (Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2))
  );
};
const fmtTime = t => t ? t.slice(0, 5) : '—';
const fmtDate = (d, lang) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const getGreeting = (lang) => {
  const h = new Date().getHours();
  return lang === 'ar'
    ? (h < 12 ? 'صباح الخير' : h < 17 ? 'مساء الخير' : 'مساء الخير')
    : (h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
};
const nowISO = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().split(' ')[0];

const openWebDatePicker = (currentVal, onPick) => {
  if (Platform.OS !== 'web') return;
  const el = document.createElement('input');
  el.type = 'date'; el.value = currentVal || '';
  el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(el);
  const clean = () => setTimeout(() => { try { document.body.removeChild(el) } catch (e) { } }, 300);
  el.addEventListener('change', e => { if (e.target.value) onPick(e.target.value); clean(); });
  el.addEventListener('blur', clean);
  if (el.showPicker) el.showPicker(); else { el.focus(); el.click(); }
};

/* ═══════════════════ REUSABLE COMPONENTS ═══════════════════ */
const ScreenWrap = ({ children, dark, isConnected, lang }) => {
  const ins = useSafeAreaInsets(), t = useT(dark);
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: ins.top, paddingBottom: ins.bottom }}>
      {isConnected === false && <OfflineBanner dark={dark} lang={lang} />}
      {children}
    </View>
  );
};

const LangToggle = ({ dark, lang, setLang }) => {
  const t = useT(dark);
  return (
    <TouchableOpacity
      onPress={() => setLang(lang === 'en' ? 'ar' : 'en')}
      activeOpacity={0.7}
      style={{
        backgroundColor: t.skyDim, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 7,
        borderWidth: 1, borderColor: t.skyBorder,
        flexDirection: 'row', alignItems: 'center', gap: 4,
      }}
    >
      <Text style={{ fontSize: 13 }}>🌐</Text>
      <Text style={{ color: t.sky, fontWeight: '700', fontSize: 12 }}>{lang === 'en' ? 'عربي' : 'EN'}</Text>
    </TouchableOpacity>
  );
};

const ScreenHeader = ({ dark, title, onBack, right, lang, setLang }) => {
  const t = useT(dark);
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
      backgroundColor: t.card,
      borderBottomWidth: 1, borderBottomColor: t.border,
      ...shadow('sm'),
    }}>
      <TouchableOpacity
        onPress={onBack} activeOpacity={0.7}
        style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: t.skyDim, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: t.skyBorder,
        }}
      >
        <Text style={{ color: t.sky, fontSize: 20, fontWeight: '700', lineHeight: 22 }}>‹</Text>
      </TouchableOpacity>
      <Text style={{
        flex: 1, fontSize: 17, fontWeight: '700', color: t.text,
        marginLeft: 12, marginRight: 8,
        textAlign: lang === 'ar' ? 'right' : 'left',
      }}>{title}</Text>
      {setLang && <LangToggle dark={dark} lang={lang} setLang={setLang} />}
      {right}
    </View>
  );
};

const AppBtn = ({ dark, label, icon, color, loading, disabled, onPress, style }) => {
  const t = useT(dark), c = color || t.sky, dis = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress} disabled={dis} activeOpacity={0.75}
      style={[{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 52, borderRadius: 14, paddingHorizontal: 20,
        backgroundColor: dis ? t.surface : c, opacity: dis ? 0.40 : 1,
      }, !dis && shadow('md'), style]}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <>
          {icon && <Text style={{ fontSize: 17, marginRight: 8 }}>{icon}</Text>}
          <Text style={{ color: dis ? t.sub : '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 }}>{label}</Text>
        </>
      }
    </TouchableOpacity>
  );
};

const ActionCard = ({ dark, icon, label, color, disabled, onPress }) => {
  const t = useT(dark), c = color || t.sky;
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled} activeOpacity={0.7}
      style={{
        flex: 1, paddingVertical: IS_SMALL ? 14 : 18, paddingHorizontal: 8,
        borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: t.card,
        borderWidth: 1.5, borderColor: disabled ? t.border : `${c}28`,
        opacity: disabled ? 0.38 : 1,
        ...shadow('sm'),
      }}
    >
      <Text style={{ fontSize: IS_SMALL ? 22 : 26, marginBottom: 7 }}>{icon}</Text>
      <Text style={{
        fontSize: IS_SMALL ? 10 : 11, fontWeight: '700',
        color: disabled ? t.sub : c, letterSpacing: 0.3, textAlign: 'center',
      }}>{label}</Text>
    </TouchableOpacity>
  );
};

const Badge = ({ dark, label, color }) => {
  const t = useT(dark), c = color || t.sky;
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: `${c}18`, borderWidth: 1, borderColor: `${c}25` }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: c, letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
};

const Empty = ({ dark, icon, title, sub }) => {
  const t = useT(dark);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 8, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 14, color: t.sub, textAlign: 'center', lineHeight: 22 }}>{sub}</Text>
    </View>
  );
};

const StatBox = ({ dark, value, label, color }) => {
  const t = useT(dark), c = color || t.sky;
  return (
    <View style={{
      flex: 1, borderRadius: 16, padding: 16, alignItems: 'center',
      backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
      ...shadow('sm'),
    }}>
      <Text style={{ fontSize: IS_SMALL ? 22 : 28, fontWeight: '800', color: c }}>{value}</Text>
      <Text style={{ fontSize: 10, color: t.sub, marginTop: 3, fontWeight: '600', letterSpacing: 0.4, textAlign: 'center' }}>{label}</Text>
    </View>
  );
};

const InfoRow = ({ dark, label, value, lang }) => {
  const t = useT(dark);
  return (
    <View style={{
      flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 4,
      borderBottomWidth: 1, borderBottomColor: t.border,
    }}>
      <Text style={{ width: 120, fontSize: 13, color: t.sub, fontWeight: '500', textAlign: lang === 'ar' ? 'right' : 'left' }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 14, color: t.text, fontWeight: '600', textAlign: lang === 'ar' ? 'right' : 'left' }}>{value || '—'}</Text>
    </View>
  );
};

/* ═══════════════════ SAFE MODAL ═══════════════════ */
const SafeModal = ({ visible, onClose, children, dark }) => {
  const t = useT(dark);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={onClose}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.52)',
            }}
          />
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { }}
            style={{
              width: '100%', maxWidth: 400,
              backgroundColor: t.card,
              borderRadius: 22,
              ...shadow('xl'),
              borderWidth: 1, borderColor: t.border,
            }}
          >
            {children}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* ═══════════════════ CALENDAR PICKER ═══════════════════ */
const CalendarPicker = ({ dark, value, onChange, lang, minDate }) => {
  const t = useT(dark), l = L[lang];
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date(value || nowISO()));

  const yr = month.getFullYear(), mo = month.getMonth();
  const firstDow = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDow; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const mNames = [l.jan, l.feb, l.mar, l.apr, l.may, l.jun, l.jul, l.aug, l.sep, l.oct, l.nov, l.dec];
  const dNames = [l.su, l.mo, l.tu, l.we, l.th, l.fr, l.sa];

  const todayStr = nowISO();
  const minDateStr = minDate || null;

  const isDayDisabled = (d) => {
    if (!d) return true;
    const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (minDateStr && ds < minDateStr) return true;
    return false;
  };

  const selDay = (d) => {
    if (isDayDisabled(d)) return;
    const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onChange(ds); setOpen(false);
  };
  const isSel = (d) => d && value === `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isToday = (d) => d && `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` === todayStr;

  const triggerBtn = (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS === 'web') openWebDatePicker(value, onChange);
        else { setMonth(new Date(value || nowISO())); setOpen(true); }
      }}
      activeOpacity={0.7}
      style={{
        flex: 1, height: 52, backgroundColor: t.inputBg,
        borderRadius: 13, paddingHorizontal: 14, borderWidth: 1.5,
        borderColor: value ? t.skyBorder : t.border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: value ? t.text : t.muted, fontSize: 14, fontWeight: '500' }}>{value || 'YYYY-MM-DD'}</Text>
      <Text style={{ fontSize: 16 }}>📅</Text>
    </TouchableOpacity>
  );

  if (Platform.OS === 'web') return triggerBtn;

  return (
    <>
      {triggerBtn}
      <SafeModal visible={open} onClose={() => setOpen(false)} dark={dark}>
        <View style={{ padding: 22 }}>
          {/* Month Nav */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <TouchableOpacity onPress={() => setMonth(new Date(yr, mo - 1, 1))} hitSlop={12}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{mNames[mo]} {yr}</Text>
            <TouchableOpacity onPress={() => setMonth(new Date(yr, mo + 1, 1))} hitSlop={12}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          </View>
          {/* Day Names */}
          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            {dNames.map(d => (
              <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, color: t.muted, fontWeight: '700', letterSpacing: 0.3 }}>{d}</Text>
              </View>
            ))}
          </View>
          {/* Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {days.map((d, i) => {
              if (d === null) return <View key={`e${i}`} style={{ width: '14.28%', height: 44 }} />;
              const selected = isSel(d), today = isToday(d);
              const disabled = isDayDisabled(d);
              return (
                <TouchableOpacity key={d} onPress={() => selDay(d)} disabled={disabled}
                  style={{ width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: selected ? t.sky : today ? t.skyDim : 'transparent',
                    borderWidth: today && !selected ? 1 : 0, borderColor: t.sky,
                    opacity: disabled ? 0.3 : 1,
                  }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: selected || today ? '700' : '400',
                      color: selected ? '#fff' : today ? t.sky : t.text,
                    }}>{d}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => setOpen(false)}
            style={{ marginTop: 18, paddingVertical: 13, borderRadius: 13, backgroundColor: t.surface, alignItems: 'center' }}>
            <Text style={{ color: t.sub, fontWeight: '600', fontSize: 14 }}>{l.cancel}</Text>
          </TouchableOpacity>
        </View>
      </SafeModal>
    </>
  );
};

/* ═══════════════════ LOGIN SCREEN ═══════════════════ */
const LoginScreen = ({ onLogin, lang, setLang }) => {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const l = L[lang];
  const isConnected = useNetworkStatus();

  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOp = useRef(new Animated.Value(0)).current;
  const tagOp = useRef(new Animated.Value(0)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
        Animated.timing(logoOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(tagOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardOp, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('', lang === 'ar' ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email.');
    if (!pw.trim()) return Alert.alert('', lang === 'ar' ? 'الرجاء إدخال كلمة المرور' : 'Please enter your password.');
    if (!isConnected) return Alert.alert(l.no_internet, l.no_internet_sub);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
      if (error) Alert.alert(lang === 'ar' ? 'فشل تسجيل الدخول' : 'Login Failed', error.message);
    } catch (e) {
      Alert.alert(l.no_internet, l.no_internet_sub);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!resetEmail.trim()) return Alert.alert('', lang === 'ar' ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email.');
    if (!isConnected) return Alert.alert(l.no_internet, l.no_internet_sub);
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
      if (error) { Alert.alert('Error', error.message); setResetLoading(false); return; }
      Alert.alert(l.reset_sent, l.reset_sent_msg);
      setResetOpen(false); setResetEmail('');
    } catch (e) {
      Alert.alert(l.no_internet, l.no_internet_sub);
    }
    setResetLoading(false);
  };

  const inputStyle = {
    flex: 1, color: '#0B1120', fontSize: 15, fontWeight: '500',
    padding: 0, textAlign: lang === 'ar' ? 'right' : 'left',
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {!isConnected && <OfflineBanner dark={false} lang={lang} />}

      {/* Decorative bg circles */}
      <View style={{ position: 'absolute', top: -80, right: -50, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(56,189,248,0.06)' }} />
      <View style={{ position: 'absolute', top: 60, left: -90, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(34,197,94,0.04)' }} />
      <View style={{ position: 'absolute', bottom: -100, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(56,189,248,0.05)' }} />

      {/* Language Toggle */}
      <View style={{ position: 'absolute', top: 54, right: 20, zIndex: 10 }}>
        <LangToggle dark={false} lang={lang} setLang={setLang} />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo block */}
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <Animated.View style={{ opacity: logoOp, transform: [{ scale: logoScale }] }}>
            <MergeLogo size="lg" dark={false} />
          </Animated.View>
          <Animated.Text style={{
            color: '#94A3B8', fontSize: 12, marginTop: 14,
            letterSpacing: 2.5, opacity: tagOp, fontWeight: '500',
            textTransform: 'uppercase',
          }}>
            Employee Portal
          </Animated.Text>
        </View>

        {/* Login Card */}
        <Animated.View style={{ opacity: cardOp, transform: [{ translateY: cardY }] }}>
          <Text style={{
            color: '#0B1120', fontSize: 24, fontWeight: '800',
            marginBottom: 5, textAlign: lang === 'ar' ? 'right' : 'left', letterSpacing: -0.3,
          }}>{l.welcome_back}</Text>
          <Text style={{
            color: '#64748B', fontSize: 14, marginBottom: 28,
            textAlign: lang === 'ar' ? 'right' : 'left', lineHeight: 20,
          }}>{l.sign_in_sub}</Text>

          {/* Email Field */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              color: '#475569', fontSize: 11, fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: 0.9,
              marginBottom: 8, textAlign: lang === 'ar' ? 'right' : 'left',
            }}>{l.email}</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', height: 54,
              backgroundColor: '#F7FAFF', borderRadius: 14, paddingHorizontal: 16,
              borderWidth: 1.5, borderColor: '#E2EAF4',
            }}>
              <TextInput
                style={inputStyle}
                placeholder={l.enter_email}
                placeholderTextColor="#9BB0C8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{
              color: '#475569', fontSize: 11, fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: 0.9,
              marginBottom: 8, textAlign: lang === 'ar' ? 'right' : 'left',
            }}>{l.password}</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', height: 54,
              backgroundColor: '#F7FAFF', borderRadius: 14, paddingHorizontal: 16,
              borderWidth: 1.5, borderColor: '#E2EAF4',
            }}>
              <TextInput
                style={inputStyle}
                placeholder={l.enter_pw}
                placeholderTextColor="#9BB0C8"
                value={pw}
                onChangeText={setPw}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={12} style={{ marginLeft: 10 }}>
                <Text style={{ fontSize: 19, color: '#9BB0C8' }}>{showPw ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={() => setResetOpen(true)} style={{ marginBottom: 24, paddingVertical: 4 }}>
            <Text style={{
              color: '#0284C7', fontSize: 13, fontWeight: '600',
              textAlign: lang === 'ar' ? 'right' : 'left',
            }}>{l.forgot_pw}</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin} disabled={loading} activeOpacity={0.82}
            style={{
              height: 56, borderRadius: 16, backgroundColor: '#38BDF8',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.30, shadowRadius: 22, elevation: 8,
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 }}>{l.sign_in}</Text>
            }
          </TouchableOpacity>

          <Text style={{ color: '#CBD5E1', fontSize: 11, textAlign: 'center', marginTop: 28, letterSpacing: 1 }}>
            MERGE HR PORTAL v3.0
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Reset Password Modal */}
      <SafeModal visible={resetOpen} onClose={() => setResetOpen(false)} dark={false}>
        <View style={{ padding: 26 }}>
          <Text style={{
            color: '#0B1120', fontSize: 20, fontWeight: '800',
            marginBottom: 6, textAlign: lang === 'ar' ? 'right' : 'left', letterSpacing: -0.2,
          }}>{l.reset_title}</Text>
          <Text style={{
            color: '#64748B', fontSize: 14, marginBottom: 22,
            textAlign: lang === 'ar' ? 'right' : 'left', lineHeight: 20,
          }}>{l.reset_sub}</Text>

          <View style={{
            flexDirection: 'row', alignItems: 'center', height: 54,
            backgroundColor: '#F7FAFF', borderRadius: 14, paddingHorizontal: 16,
            borderWidth: 1.5, borderColor: '#E2EAF4', marginBottom: 18,
          }}>
            <TextInput
              style={{
                flex: 1, color: '#0B1120', fontSize: 15, fontWeight: '500',
                padding: 0, textAlign: lang === 'ar' ? 'right' : 'left',
              }}
              placeholder={l.enter_email}
              placeholderTextColor="#9BB0C8"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus={false}
            />
          </View>

          <TouchableOpacity
            onPress={handleReset} disabled={resetLoading}
            style={{
              height: 52, borderRadius: 14, backgroundColor: '#38BDF8',
              alignItems: 'center', justifyContent: 'center',
              opacity: resetLoading ? 0.6 : 1,
              shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
            }}
          >
            {resetLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{l.sign_in}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setResetOpen(false)}
            style={{ marginTop: 14, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '500' }}>{l.cancel}</Text>
          </TouchableOpacity>
        </View>
      </SafeModal>
    </KeyboardAvoidingView>
  );
};

/* ═══════════════════ HOME SCREEN ═══════════════════ */
const HomeScreen = ({ dark, employee, isClockedIn, checkingIn, checkingOut, unreadCount, onCheckIn, onCheckOut, onNav, onLogout, lang, setLang, isConnected }) => {
  const t = useT(dark), l = L[lang];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -3, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // parent will re-fetch employee data & attendance status via onNav('refresh')
    if (onNav) onNav('refresh');
    setTimeout(() => setRefreshing(false), 1200);
  }, [onNav]);

  const initials = employee ? (employee.first_name?.[0] || '') + (employee.last_name?.[0] || '') : '??';
  const dateStr = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const confirmLogout = () => {
    Alert.alert(
      l.logout_title,
      l.logout_confirm,
      [
        { text: l.no, style: 'cancel' },
        { text: l.yes, style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={t.sky}
          colors={[t.sky]}
        />
      }
    >
      {!isConnected && <OfflineBanner dark={dark} lang={lang} />}

      {/* Top bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 4 }}>
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MergeLogo size="sm" dark={dark} />
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 17, marginLeft: 7, letterSpacing: 0.4 }}>MERGE</Text>
          </View>
        </Animated.View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LangToggle dark={dark} lang={lang} setLang={setLang} />
          <TouchableOpacity
            onPress={() => onNav('notifications')} activeOpacity={0.7}
            style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: t.card, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1.5, borderColor: t.border, ...shadow('sm'),
            }}
          >
            <Text style={{ fontSize: 20 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute', top: 2, right: 2,
                backgroundColor: t.red, borderRadius: 10,
                minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: t.bg,
              }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Greeting */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontSize: IS_SMALL ? 20 : 22, fontWeight: '800', color: t.text, letterSpacing: -0.3 }}>
            {getGreeting(lang)} 👋
          </Text>
          <Text style={{ fontSize: 12, color: t.sub, marginTop: 3, fontWeight: '400' }}>{dateStr}</Text>
        </View>

        {/* Profile Card */}
        {employee ? (
          <TouchableOpacity
            onPress={() => onNav('profile')} activeOpacity={0.82}
            style={{
              backgroundColor: t.card, borderRadius: 20, padding: IS_SMALL ? 16 : 20,
              marginBottom: 16, flexDirection: 'row', alignItems: 'center',
              borderWidth: 1.5, borderColor: t.skyBorder, ...shadow('md'),
            }}
          >
            <View style={{
              width: IS_SMALL ? 48 : 56, height: IS_SMALL ? 48 : 56, borderRadius: IS_SMALL ? 24 : 28,
              backgroundColor: t.sky, alignItems: 'center', justifyContent: 'center',
              marginRight: lang === 'ar' ? 0 : 14, marginLeft: lang === 'ar' ? 14 : 0,
              shadowColor: t.sky, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35, shadowRadius: 12, elevation: 5,
            }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: IS_SMALL ? 17 : 20 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: t.text, fontWeight: '700', fontSize: IS_SMALL ? 15 : 17,
                textAlign: lang === 'ar' ? 'right' : 'left', letterSpacing: -0.2,
              }}>{employee.first_name} {employee.last_name}</Text>
              <Text style={{
                color: t.sub, fontSize: 12, marginTop: 3,
                textAlign: lang === 'ar' ? 'right' : 'left',
              }}>{employee.job_title || employee.position} · {employee.department}</Text>
            </View>
            <View style={{
              backgroundColor: t.skyDim, paddingHorizontal: 12, paddingVertical: 7,
              borderRadius: 10, borderWidth: 1, borderColor: t.skyBorder,
            }}>
              <Text style={{ color: t.sky, fontSize: 12, fontWeight: '700' }}>{l.profile}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{
            backgroundColor: t.card, borderRadius: 20, padding: 32,
            marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: t.border,
          }}>
            <ActivityIndicator color={t.sky} size="large" />
          </View>
        )}

        {/* Attendance Card */}
        <View style={{
          backgroundColor: t.card, borderRadius: 20, padding: IS_SMALL ? 16 : 20,
          marginBottom: 18, borderWidth: 1, borderColor: t.border, ...shadow('md'),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: isClockedIn ? t.green : t.muted,
            }} />
            <Text style={{ fontSize: 12, color: t.sub, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, flex: 1 }}>
              {isClockedIn ? l.clocked_in : l.todays_att}
            </Text>
            {isClockedIn && <Badge dark={dark} label={l.active} color={t.green} />}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <AppBtn
              dark={dark} icon="✅" label={l.check_in} color={t.green}
              loading={checkingIn} disabled={isClockedIn || !isConnected} onPress={onCheckIn}
              style={{ flex: 1 }}
            />
            <AppBtn
              dark={dark} icon="🚪" label={l.check_out} color={t.red}
              loading={checkingOut} disabled={!isClockedIn || !isConnected} onPress={onCheckOut}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Quick Actions Label */}
        <Text style={{
          fontSize: 11, fontWeight: '700', color: t.sub,
          textTransform: 'uppercase', letterSpacing: 0.9,
          marginBottom: 12, textAlign: lang === 'ar' ? 'right' : 'left',
        }}>{l.quick_actions}</Text>

        {/* Action Cards Row 1 */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <ActionCard dark={dark} icon="🗺️" label={l.location} color={t.sky} onPress={() => onNav('map')} />
          <ActionCard dark={dark} icon="📊" label={l.history} color={t.green} onPress={() => onNav('history')} />
          <ActionCard dark={dark} icon="🌴" label={l.leave} color={t.purple} onPress={() => onNav('leave')} />
        </View>

        {/* Action Cards Row 2 */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <ActionCard dark={dark} icon="🔐" label={l.change_pw} color={t.sub} onPress={() => onNav('change_password')} />
          <ActionCard dark={dark} icon="🏢" label={l.hr_panel} color={t.indigo} onPress={() => onNav('hr_dashboard')} />
          <ActionCard dark={dark} icon="🚪" label={l.logout} color={t.red} onPress={confirmLogout} />
        </View>

        <Text style={{ color: t.muted, fontSize: 10, textAlign: 'center', letterSpacing: 1.5, paddingVertical: 8 }}>
          MERGE HR v3.0
        </Text>
      </Animated.View>
    </ScrollView>
  );
};

/* ═══════════════════ HISTORY (FlatList + pull-to-refresh) ═══════════════════ */
const HistoryScreenComp = ({ dark, employee, goBack, lang, setLang, isConnected, shiftStart }) => {
  const t = useT(dark), l = L[lang];
  const [records, setRecords] = useState([]), [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lateThreshold = shiftStart || '09:15:00';

  const fetchRecords = useCallback(async () => {
    if (!employee?.id) return;
    const { data } = await supabase.from('attendance_records')
      .select('*').eq('employee_id', employee.id)
      .order('attendance_date', { ascending: false }).limit(60);
    setRecords(data || []);
  }, [employee]);

  useEffect(() => {
    (async () => {
      await fetchRecords();
      setLoading(false);
    })();
  }, [fetchRecords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }, [fetchRecords]);

  const renderItem = useCallback(({ item: r }) => {
    const ok = r.check_in_time && r.check_out_time;
    const late = r.check_in_time && r.check_in_time > lateThreshold;
    return (
      <View style={{
        backgroundColor: t.card, borderRadius: 16, padding: IS_SMALL ? 14 : 18,
        marginBottom: 10,
        borderWidth: 1, borderColor: ok ? `${t.green}22` : t.border,
        ...shadow('sm'),
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{fmtDate(r.attendance_date, lang)}</Text>
          {ok
            ? <Badge dark={dark} label={l.complete} color={t.green} />
            : r.check_in_time
              ? <Badge dark={dark} label={l.in_progress} color={t.amber} />
              : <Badge dark={dark} label={l.missing} color={t.red} />
          }
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.sub, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5, letterSpacing: 0.5 }}>{l.check_in_label}</Text>
            <Text style={{ color: late ? t.red : t.text, fontWeight: '700', fontSize: IS_SMALL ? 15 : 17 }}>{fmtTime(r.check_in_time)}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: t.border }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.sub, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5, letterSpacing: 0.5 }}>{l.check_out_label}</Text>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: IS_SMALL ? 15 : 17 }}>{fmtTime(r.check_out_time)}</Text>
          </View>
        </View>
      </View>
    );
  }, [dark, lang, t, lateThreshold]);

  return (
    <ScreenWrap dark={dark} isConnected={isConnected} lang={lang}>
      <ScreenHeader
        dark={dark} title={l.attendance_history} onBack={goBack}
        lang={lang} setLang={setLang}
        right={<Badge dark={dark} label={`${records.length} ${l.records}`} />}
      />
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.sky} size="large" /></View>
        : records.length === 0
          ? <Empty dark={dark} icon="📋" title={l.no_records} sub={l.no_records_sub} />
          : <FlatList
            data={records}
            keyExtractor={(r, i) => r.id?.toString() || i.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={15}
            windowSize={8}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.sky} colors={[t.sky]} />
            }
          />
      }
    </ScreenWrap>
  );
};

/* ═══════════════════ MY LOCATION ═══════════════════ */
const MyLocationScreenComp = ({ dark, goBack, lang, setLang, isConnected }) => {
  const t = useT(dark), l = L[lang];
  const [office, setOffice] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dist, setDist] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: officeArr } = await supabase.from('office_location').select('*').eq('is_active', true).limit(1); const data = officeArr?.[0] || null;
      if (data) setOffice(data);
      if (Platform.OS !== 'web') {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const ul = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setUserLoc(ul);
            setGpsAccuracy(loc.coords.accuracy || null);
            if (data) setDist(haversine(ul.latitude, ul.longitude, data.latitude, data.longitude));
          }
        } catch (e) { console.log('Location error:', e.message); }
      }
      setLoading(false);
    })();
  }, []);

  const inRange = dist !== null && office && dist <= (office.radius_meters + (gpsAccuracy || 0));

  if (loading) return (
    <ScreenWrap dark={dark} isConnected={isConnected} lang={lang}>
      <ScreenHeader dark={dark} title={l.my_location} onBack={goBack} lang={lang} setLang={setLang} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={t.sky} />
        <Text style={{ color: t.sub, marginTop: 14, fontSize: 13 }}>{l.loading}</Text>
      </View>
    </ScreenWrap>
  );

  if (Platform.OS === 'web') {
    const mapsUrl = `https://maps.google.com/maps?q=${office?.latitude},${office?.longitude}&z=16&output=embed`;
    return (
      <ScreenWrap dark={dark} isConnected={isConnected} lang={lang}>
        <ScreenHeader dark={dark} title={l.my_location} onBack={goBack} lang={lang} setLang={setLang} />
        <View style={{ flex: 1, margin: 16, borderRadius: 18, overflow: 'hidden', ...shadow('md') }}>
          {office
            ? <iframe src={mapsUrl} style={{ flex: 1, width: '100%', border: 'none', borderRadius: 18 }} allowFullScreen title="Office Map" />
            : <Empty dark={dark} icon="🗺️" title="Not Available" sub="No office location configured." />
          }
        </View>
      </ScreenWrap>
    );
  }

  return (
    <ScreenWrap dark={dark} isConnected={isConnected} lang={lang}>
      <ScreenHeader dark={dark} title={l.my_location} onBack={goBack} lang={lang} setLang={setLang} />
      {MapView && office ? (
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{ latitude: office.latitude, longitude: office.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
          >
            <Marker coordinate={{ latitude: office.latitude, longitude: office.longitude }} title="Office" />
            {Circle && <Circle
              center={{ latitude: office.latitude, longitude: office.longitude }}
              radius={office.radius_meters}
              strokeColor="rgba(56,189,248,0.6)"
              fillColor="rgba(56,189,248,0.08)"
              strokeWidth={2}
            />}
            {userLoc && <Marker coordinate={userLoc} pinColor="green" title="You" />}
          </MapView>
          {/* Info Bar */}
          <View style={{
            backgroundColor: t.card, padding: 18,
            borderTopWidth: 1, borderTopColor: t.border,
            flexDirection: 'row', justifyContent: 'space-around',
            ...shadow('lg'),
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: t.sub, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>{l.allowed_radius}</Text>
              <Text style={{ color: t.sky, fontSize: 22, fontWeight: '800' }}>{office.radius_meters}m</Text>
            </View>
            <View style={{ width: 1, backgroundColor: t.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: t.sub, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>{l.your_distance}</Text>
              <Text style={{
                color: dist !== null ? (inRange ? t.green : t.red) : t.sub,
                fontSize: 22, fontWeight: '800',
              }}>{dist !== null ? `${dist.toFixed(0)}m` : '—'}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: t.sub, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>Status</Text>
              <Text style={{ fontSize: 22 }}>{dist !== null ? (inRange ? '✅' : '❌') : '📍'}</Text>
            </View>
          </View>
        </View>
      ) : (
        <Empty dark={dark} icon="📍" title={l.loc_denied} sub={l.loc_denied_sub} />
      )}
    </ScreenWrap>
  );
};

/* ═══════════════════ LEAVE REQUEST ═══════════════════ */
const LeaveRequestScreenComp = ({ dark, employee, goBack, lang, setLang, isConnected }) => {
  const t = useT(dark), l = L[lang];
  const types = ['Annual', 'Sick', 'Emergency', 'Personal', 'Maternity', 'Unpaid'];
  const [type, setType] = useState('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [tab, setTab] = useState('new');
  const [refreshing, setRefreshing] = useState(false);

  const refreshLeaves = useCallback(async () => {
    if (!employee?.id) return;
    const { data } = await supabase.from('leave_requests').select('*')
      .eq('employee_id', employee.id).order('created_at', { ascending: false }).limit(20);
    setMyLeaves(data || []);
  }, [employee]);

  useEffect(() => { refreshLeaves(); }, [refreshLeaves]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLeaves();
    setRefreshing(false);
  }, [refreshLeaves]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate), e = new Date(endDate);
    if (e < s) return 0;
    return Math.ceil((e - s) / 86400000) + 1;
  }, [startDate, endDate]);

  const handleSubmit = async () => {
    if (!isConnected) return Alert.alert(l.no_internet, l.no_internet_sub);
    if (!startDate || !endDate) return Alert.alert('', l.missing_dates);
    if (totalDays <= 0) return Alert.alert('', l.invalid_dates);
    if (!reason.trim()) return Alert.alert('', l.missing_reason);
    setSubmitting(true);
    const { error } = await supabase.from('leave_requests').insert([{
      employee_id: employee.id, leave_type: type, start_date: startDate,
      end_date: endDate, total_days: totalDays, reason: reason.trim(), status: 'pending',
    }]);
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert(l.submitted, `${l.submitted_msg} ${totalDays} ${totalDays > 1 ? l.days : l.day}.`);
    setStartDate(''); setEndDate(''); setReason('');
    await refreshLeaves(); setTab('history');
  };

  const sc = s => s === 'approved' ? t.green : s === 'rejected' ? t.red : t.amber;

  const renderLeave = useCallback(({ item: lv }) => (
    <View style={{
      backgroundColor: t.card, borderRadius: 16, padding: 16, marginBottom: 10,
      borderWidth: 1, borderColor: t.border, ...shadow('sm'),
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{lv.leave_type} {l.leave}</Text>
        <Badge dark={dark} label={lv.status?.toUpperCase()} color={sc(lv.status)} />
      </View>
      <Text style={{ color: t.sub, fontSize: 13, marginBottom: 4 }}>
        📅 {fmtDate(lv.start_date, lang)} — {fmtDate(lv.end_date, lang)}
      </Text>
      <Text style={{ color: t.sub, fontSize: 12 }}>
        ⏱ {lv.total_days} {lv.total_days > 1 ? l.days : l.day}
      </Text>
      {lv.reason && (
        <Text style={{
          color: t.muted, fontSize: 12, marginTop: 8, fontStyle: 'italic',
          textAlign: lang === 'ar' ? 'right' : 'left', lineHeight: 18,
        }}>"{lv.reason}"</Text>
      )}
    </View>
  ), [dark, lang, t]);

  const todayStr = nowISO();

  return (
    <ScreenWrap dark={dark} isConnected={isConnected} lang={lang}>
      <ScreenHeader dark={dark} title={l.leave_request} onBack={goBack} lang={lang} setLang={setLang} />

      {/* Tab switcher */}
      <View style={{
        flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4,
        backgroundColor: t.surface, borderRadius: 14, padding: 4,
      }}>
        {[['new', l.new_request, '📝'], ['history', l.my_leaves, '📋']].map(([k, v, ic]) => (
          <TouchableOpacity
            key={k} onPress={() => setTab(k)}
            style={{
              flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center',
              backgroundColor: tab === k ? t.card : 'transparent',
              flexDirection: 'row', justifyContent: 'center', gap: 6,
              ...tab === k ? shadow('sm') : {},
            }}
          >
            <Text style={{ fontSize: 13 }}>{ic}</Text>
            <Text style={{ color: tab === k ? t.sky : t.sub, fontWeight: '700', fontSize: 13 }}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'new' ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Leave Type */}
          <Text style={{
            color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: 0.9, marginBottom: 10, textAlign: lang === 'ar' ? 'right' : 'left',
          }}>{l.leave_type}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {types.map(lt => (
              <TouchableOpacity
                key={lt} onPress={() => setType(lt)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, marginRight: 8,
                  backgroundColor: type === lt ? t.sky : t.card,
                  borderWidth: 1.5, borderColor: type === lt ? t.sky : t.border,
                  ...type === lt ? shadow('sm') : {},
                }}
              >
                <Text style={{ color: type === lt ? '#fff' : t.sub, fontWeight: '700', fontSize: 13 }}>{lt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date pickers with minDate = today */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.9, marginBottom: 8, textAlign: lang === 'ar' ? 'right' : 'left',
              }}>{l.start_date}</Text>
              <CalendarPicker dark={dark} value={startDate} onChange={setStartDate} lang={lang} minDate={todayStr} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.9, marginBottom: 8, textAlign: lang === 'ar' ? 'right' : 'left',
              }}>{l.end_date}</Text>
              <CalendarPicker dark={dark} value={endDate} onChange={setEndDate} lang={lang} minDate={startDate || todayStr} />
            </View>
          </View>

          {/* Duration pill */}
          {totalDays > 0 && (
            <View style={{
              backgroundColor: `${t.green}12`, borderWidth: 1.5, borderColor: `${t.green}22`,
              borderRadius: 14, padding: 14, marginBottom: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Text style={{ fontSize: 18 }}>📅</Text>
              <Text style={{ color: t.green, fontWeight: '800', fontSize: 16 }}>
                {totalDays} {totalDays > 1 ? l.days : l.day}
              </Text>
            </View>
          )}

          {/* Reason */}
          <Text style={{
            color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: 0.9, marginBottom: 8, textAlign: lang === 'ar' ? 'right' : 'left',
          }}>{l.reason}</Text>
          <TextInput
            style={{
              minHeight: 110, backgroundColor: t.inputBg, borderRadius: 14,
              paddingHorizontal: 16, paddingTop: 14, color: t.text, fontSize: 14, fontWeight: '500',
              borderWidth: 1.5, borderColor: t.border, textAlignVertical: 'top',
              textAlign: lang === 'ar' ? 'right' : 'left', lineHeight: 22,
            }}
            placeholder={l.describe_reason}
            placeholderTextColor={t.muted}
            value={reason}
            onChangeText={setReason}
            multiline numberOfLines={4}
          />
          <AppBtn
            dark={dark} label={l.submit_request} icon="📤" color={t.sky}
            loading={submitting} disabled={!isConnected} onPress={handleSubmit}
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={myLeaves}
          keyExtractor={(lv, i) => lv.id?.toString() || i.toString()}
          renderItem={renderLeave}
          contentContainerStyle={{ padding: 16, paddingBottom: 30, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Empty dark={dark} icon="🌴" title={l.no_leaves} sub={l.no_leaves_sub} />}
          initialNumToRender={10}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.sky} colors={[t.sky]} />
          }
        />
      )}
    </ScreenWrap>
  );
};

/* ═══════════════════ NOTIFICATIONS (Real-time + pull-to-refresh) ═══════════════════ */
const NotificationsScreenComp = ({ dark, employee, goBack, onRead, lang, setLang, isConnected }) => {
  const t = useT(dark), l = L[lang];
  const [notifs, setNotifs] = useState([]), [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchN = useCallback(async () => {
    if (!employee?.id) return;
    const { data } = await supabase.from('notifications').select('*')
      .or(`employee_id.eq.${employee.id},employee_id.is.null`)
      .order('created_at', { ascending: false }).limit(50);
    setNotifs(data || []);
    setLoading(false);
  }, [employee]);

  useEffect(() => { fetchN(); }, [fetchN]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!employee?.id) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new;
          if (newNotif.employee_id === employee.id || newNotif.employee_id === null) {
            setNotifs(prev => [newNotif, ...prev]);
            onRead?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employee]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchN();
    setRefreshing(false);
  }, [fetchN]);

  const markRead = useCallback(async id => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
    onRead?.();
  }, [onRead]);

  const markAllRead = useCallback(async () => {
    const ur = notifs.filter(n => !n.is_read);
    if (ur.length === 0) return;
    const ids = ur.map(u => u.id);
    // Batch update
    for (const id of ids) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
    setNotifs(p => p.map(n => ({ ...n, is_read: true })));
    onRead?.();
  }, [notifs, onRead]);

  const tc = type => type === 'leave' ? t.purple : type === 'attendance' ? t.green : t.sky;
  const unreadCount = notifs.filter(n => !n.is_read).length;

  const renderItem = useCallback(({ item: n }) => (
    <TouchableOpacity
      onPress={() => !n.is_read && markRead(n.id)} activeOpacity={0.75}
      style={{
        backgroundColor: t.card, borderRadius: 16, padding: 16, marginBottom: 10,
        borderWidth: 1, borderColor: n.is_read ? t.border : t.skyBorder,
        flexDirection: 'row', ...shadow('sm'),
        opacity: n.is_read ? 0.78 : 1,
      }}
    >
      {!n.is_read && (
        <View style={{
          width: 9, height: 9, borderRadius: 4.5,
          backgroundColor: t.sky, marginRight: 12, marginTop: 5, flexShrink: 0,
        }} />
      )}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7, gap: 8, flexWrap: 'wrap' }}>
          <Badge dark={dark} label={n.type?.toUpperCase() || 'INFO'} color={tc(n.type)} />
          <Text style={{ color: t.muted, fontSize: 11 }}>
            {n.created_at ? new Date(n.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }) : ''}
          </Text>
        </View>
        <Text style={{
          color: t.text, fontSize: 14, fontWeight: n.is_read ? '500' : '600',
          lineHeight: 21, textAlign: lang === 'ar' ? 'right' : 'left',
        }}>{n.title || n.message || 'Notification'}</Text>
        {n.message && n.title && (
          <Text style={{
            color: t.sub, fontSize: 13, marginTop: 5, lineHeight: 19,
            textAlign: lang === 'ar' ? 'right' : 'left',
          }}>{n.message}</Text>
        )}
      </View>
    </TouchableOpacity>
  ), [dark, lang, t, markRead]);

  const headerRight = unreadCount > 0 ? (
    <TouchableOpacity
      onPress={markAllRead}
      style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: t.skyDim, borderWidth: 1, borderColor: t.skyBorder }}
    >
      <Text style={{ color: t.sky, fontSize: 11, fontWeight: '700' }}>{l.mark_all_read}</Text>
    </TouchableOpacity>
  ) : null;

  return (
    <ScreenWrap dark={dark} isConnected={isConnected} lang={lang}>
      <ScreenHeader dark={dark} title={l.notifications} onBack={goBack} lang={lang} setLang={setLang} right={headerRight} />
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.sky} size="large" /></View>
        : <FlatList
          data={notifs}
          keyExtractor={(n, i) => n.id?.toString() || i.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 30, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Empty dark={dark} icon="🔕" title={l.no_notifs} sub={l.no_notifs_sub} />}
          initialNumToRender={15}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.sky} colors={[t.sky]} />
          }
        />
      }
    </ScreenWrap>
  );
};

/* ═══════════════════ PROFILE ═══════════════════ */
const ProfileScreenComp = ({ dark, employee, goBack, setDarkMode, onChangePassword, lang, setLang, isConnected, shiftStart }) => {
  const t = useT(dark), l = L[lang];
  const initials = employee ? (employee.first_name?.[0] || '') + (employee.last_name?.[0] || '') : '??';
  const [stats, setStats] = useState({ days: 0, month: 0, onTime: 0 });
  const [leaves, setLeaves] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const lateThreshold = shiftStart || '09:15:00';

  const fetchData = useCallback(async () => {
    if (!employee?.id) return;
    const { data: recs } = await supabase.from('attendance_records').select('*').eq('employee_id', employee.id);
    const done = (recs || []).filter(r => r.check_in_time && r.check_out_time);
    const ot = done.filter(r => r.check_in_time <= lateThreshold);
    const n = new Date();
    const mo = done.filter(r => { const d = new Date(r.attendance_date); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); });
    setStats({ days: done.length, month: mo.length, onTime: ot.length });
    const { data: lv } = await supabase.from('leave_requests').select('*')
      .eq('employee_id', employee.id).order('created_at', { ascending: false }).limit(10);
    setLeaves(lv || []);
  }, [employee, lateThreshold]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const sc = s => s === 'approved' ? t.green : s === 'rejected' ? t.red : t.amber;
  const pct = stats.days > 0 ? Math.round(stats.onTime / stats.days * 100) : 0;

  return (
    <ScreenWrap dark={dark} isConnected={isConnected} lang={lang}>
      <ScreenHeader dark={dark} title={l.my_profile} onBack={goBack} lang={lang} setLang={setLang} />
      <ScrollView
        style={{ flex: 1 }} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.sky} colors={[t.sky]} />
        }
      >

        {/* Avatar + Name */}
        <View style={{
          alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20,
          backgroundColor: t.card, borderBottomWidth: 1, borderBottomColor: t.border,
          marginBottom: 16,
        }}>
          <View style={{
            width: IS_SMALL ? 80 : 96, height: IS_SMALL ? 80 : 96,
            borderRadius: IS_SMALL ? 40 : 48, backgroundColor: t.sky,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: t.sky, shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35, shadowRadius: 22, elevation: 8,
          }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: IS_SMALL ? 28 : 36 }}>{initials}</Text>
          </View>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: IS_SMALL ? 18 : 22, marginTop: 14, letterSpacing: -0.3 }}>
            {employee?.first_name} {employee?.last_name}
          </Text>
          <Text style={{ color: t.sub, fontSize: 14, marginTop: 4 }}>{employee?.job_title || employee?.position}</Text>
          <View style={{
            marginTop: 10, paddingHorizontal: 14, paddingVertical: 7,
            borderRadius: 10, backgroundColor: t.skyDim, borderWidth: 1, borderColor: t.skyBorder,
          }}>
            <Text style={{ color: t.sky, fontWeight: '700', fontSize: 12 }}>{employee?.department}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 20 }}>
          <StatBox dark={dark} value={stats.days} label={l.total_days} color={t.sky} />
          <StatBox dark={dark} value={stats.month} label={l.this_month} color={t.green} />
          <StatBox dark={dark} value={`${pct}%`} label={l.on_time} color={t.amber} />
        </View>

        {/* Info Card */}
        <View style={{
          backgroundColor: t.card, borderRadius: 18, paddingHorizontal: 20,
          marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: t.border, ...shadow('sm'),
        }}>
          <InfoRow dark={dark} label={l.email} value={employee?.email} lang={lang} />
          <InfoRow dark={dark} label={l.phone} value={employee?.phone} lang={lang} />
          <InfoRow dark={dark} label={l.position} value={employee?.position} lang={lang} />
          <InfoRow dark={dark} label={l.department} value={employee?.department} lang={lang} />
          <InfoRow dark={dark} label={l.joined} value={employee?.hire_date ? fmtDate(employee.hire_date, lang) : '—'} lang={lang} />
        </View>

        {/* Dark Mode Toggle */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: t.card, borderRadius: 16, padding: 18,
          marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: t.border, ...shadow('sm'),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 42, height: 42, borderRadius: 14, backgroundColor: t.surface,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 20 }}>{dark ? '🌙' : '☀️'}</Text>
            </View>
            <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>{dark ? l.dark_mode : l.light_mode}</Text>
          </View>
          <Switch
            value={dark} onValueChange={setDarkMode}
            trackColor={{ false: t.border, true: `${t.sky}90` }}
            thumbColor={dark ? t.sky : '#fff'}
          />
        </View>

        {/* Change Password */}
        <TouchableOpacity
          onPress={onChangePassword} activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: t.card, borderRadius: 16, padding: 18,
            marginHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: t.border, ...shadow('sm'),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 42, height: 42, borderRadius: 14, backgroundColor: t.surface,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 20 }}>🔐</Text>
            </View>
            <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>{l.change_password}</Text>
          </View>
          <Text style={{ color: t.sub, fontSize: 20 }}>›</Text>
        </TouchableOpacity>

        {/* Recent Leaves */}
        {leaves.length > 0 && (
          <>
            <Text style={{
              color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
              letterSpacing: 0.9, paddingHorizontal: 16, marginBottom: 10,
            }}>{l.recent_leaves}</Text>
            <View style={{
              backgroundColor: t.card, borderRadius: 18, paddingHorizontal: 16,
              marginHorizontal: 16, marginBottom: 30, borderWidth: 1, borderColor: t.border, ...shadow('sm'),
            }}>
              {leaves.slice(0, 5).map((lv, i) => (
                <View key={lv.id || i} style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
                  borderBottomWidth: i < Math.min(4, leaves.length - 1) ? 1 : 0, borderBottomColor: t.border,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontWeight: '600', fontSize: 14, marginBottom: 2 }}>
                      {lv.leave_type} · {lv.total_days}d
                    </Text>
                    <Text style={{ color: t.sub, fontSize: 12 }}>
                      {fmtDate(lv.start_date, lang)} — {fmtDate(lv.end_date, lang)}
                    </Text>
                  </View>
                  <Badge dark={dark} label={lv.status?.toUpperCase()} color={sc(lv.status)} />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrap>
  );
};

/* ═══════════════════ CHANGE PASSWORD ═══════════════════ */
const ChangePasswordScreenComp = ({ dark, goBack, lang, setLang, isConnected }) => {
  const t = useT(dark), l = L[lang];
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [cnf, setCnf] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNw, setShowNw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!cur.trim() || !nw.trim() || !cnf.trim()) return;
    if (!isConnected) return Alert.alert(l.no_internet, l.no_internet_sub);
    if (nw.length < 6) return Alert.alert('', l.weak_pw);
    if (nw !== cnf) return Alert.alert('', l.mismatch);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: nw });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert(l.pw_success, '');
    goBack();
  };

  const PwField = ({ label, value, setValue, show, setShow }) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={{
        color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
        letterSpacing: 0.9, marginBottom: 8, textAlign: lang === 'ar' ? 'right' : 'left',
      }}>{label}</Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', height: 54,
        backgroundColor: t.inputBg, borderRadius: 14, paddingHorizontal: 16,
        borderWidth: 1.5, borderColor: t.border,
      }}>
        <TextInput
          style={{
            flex: 1, color: t.text, fontSize: 15, fontWeight: '500',
            padding: 0, textAlign: lang === 'ar' ? 'right' : 'left',
          }}
          placeholder="••••••••"
          placeholderTextColor={t.muted}
          value={value}
          onChangeText={setValue}
          secureTextEntry={!show}
        />
        <TouchableOpacity onPress={() => setShow(!show)} hitSlop={12} style={{ marginLeft: 10 }}>
          <Text style={{ fontSize: 18, color: t.sub }}>{show ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrap dark={dark} isConnected={isConnected} lang={lang}>
      <ScreenHeader dark={dark} title={l.change_password} onBack={goBack} lang={lang} setLang={setLang} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{
            backgroundColor: t.card, borderRadius: 20, padding: 24,
            borderWidth: 1, borderColor: t.border, marginBottom: 20, ...shadow('md'),
          }}>
            <PwField label={l.current_pw} value={cur} setValue={setCur} show={showCur} setShow={setShowCur} />
            <PwField label={l.new_pw} value={nw} setValue={setNw} show={showNw} setShow={setShowNw} />
            <PwField label={l.confirm_pw} value={cnf} setValue={setCnf} show={showNw} setShow={setShowNw} />
            <AppBtn dark={dark} label={l.update_pw} icon="🔒" color={t.sky} loading={loading} disabled={!isConnected} onPress={handle} />
          </View>
          <Text style={{ color: t.sub, fontSize: 12, textAlign: 'center', lineHeight: 19 }}>{l.pw_hint}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrap>
  );
};

/* ═══════════════════ HR DASHBOARD (Lazy Tab Loading) ═══════════════════ */
const HRDashboardScreenComp = ({ dark, goBack, lang, isConnected }) => {
  const t = useT(dark), l = L[lang];
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, pendingLeaves: 0 });
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState('announcement');
  const [notifSending, setNotifSending] = useState(false);
  const [expType, setExpType] = useState('attendance');
  const [expFrom, setExpFrom] = useState('');
  const [expTo, setExpTo] = useState('');
  const [expLoading, setExpLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState({});

  const loadStats = useCallback(async () => {
    const today = nowISO();
    const { data: empD } = await supabase.from('employees').select('id').eq('status', 'active');
    const { data: attD } = await supabase.from('attendance_records').select('employee_id').eq('attendance_date', today);
    const { data: lvD } = await supabase.from('leave_requests').select('id').eq('status', 'pending');
    const total = empD?.length || 0, present = attD?.length || 0;
    setStats({ total, present, absent: total - present, pendingLeaves: lvD?.length || 0 });
  }, []);

  const loadAttendance = useCallback(async () => {
    const { data } = await supabase.from('attendance_records')
      .select('*,employees(first_name,last_name,employee_code,department)')
      .eq('attendance_date', nowISO()).order('check_in_time', { ascending: false });
    setAttendance(data || []);
  }, []);

  const loadLeaves = useCallback(async () => {
    const { data } = await supabase.from('leave_requests')
      .select('*,employees(first_name,last_name,employee_code,department)')
      .order('created_at', { ascending: false });
    setLeaveRequests(data || []);
  }, []);

  const loadEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees')
      .select('id,employee_code,first_name,last_name,department,job_title,status,email')
      .order('employee_code');
    setEmployees(data || []);
  }, []);

  // Load overview on mount
  useEffect(() => {
    (async () => {
      await Promise.all([loadStats(), loadAttendance()]);
      setLoadedTabs(p => ({ ...p, overview: true }));
      setLoading(false);
    })();
  }, []);

  // Lazy load tab data when switching tabs
  useEffect(() => {
    if (loadedTabs[tab]) return;
    (async () => {
      switch (tab) {
        case 'attendance':
          if (!loadedTabs.attendance) {
            await loadAttendance();
            setLoadedTabs(p => ({ ...p, attendance: true }));
          }
          break;
        case 'leaves':
          if (!loadedTabs.leaves) {
            await loadLeaves();
            setLoadedTabs(p => ({ ...p, leaves: true }));
          }
          break;
        case 'employees':
          if (!loadedTabs.employees) {
            await loadEmployees();
            setLoadedTabs(p => ({ ...p, employees: true }));
          }
          break;
      }
    })();
  }, [tab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadAttendance()]);
    // Reset loaded tabs so they refresh on next visit
    setLoadedTabs({ overview: true });
    setRefreshing(false);
  }, []);

  const handleLeaveAction = async (id, action) => {
    setLeaveLoading(true);
    await supabase.from('leave_requests').update({ status: action }).eq('id', id);
    await loadLeaves(); await loadStats();
    setLeaveLoading(false);
  };

  const sendNotification = async () => {
    if (!notifMsg.trim()) return Alert.alert('', lang === 'ar' ? 'الرجاء كتابة نص الإشعار' : 'Please write notification text.');
    if (!isConnected) return Alert.alert(l.no_internet, l.no_internet_sub);
    setNotifSending(true);
    try {
      const { data: emps } = await supabase.from('employees').select('id').eq('status', 'active');
      const inserts = emps.map(e => ({ employee_id: e.id, type: notifType, message: notifMsg, is_read: false }));
      await supabase.from('notifications').insert(inserts);
      setNotifMsg('');
      Alert.alert(lang === 'ar' ? 'تم' : 'Done', lang === 'ar' ? 'تم إرسال الإشعار بنجاح' : 'Notification sent successfully.');
    } catch (_) { Alert.alert('Error', 'Failed.'); }
    finally { setNotifSending(false); }
  };

  const handleExport = async () => {
    if (Platform.OS !== 'web') return Alert.alert(l.not_available, lang === 'ar' ? 'التصدير متاح على المتصفح فقط' : 'Export is available on web browser only.');
    setExpLoading(true);
    try {
      const XLSX = await import('xlsx');
      let rows = [], sheetName = 'Data', fileName = 'merge_export.xlsx';
      if (expType === 'attendance') {
        let q = supabase.from('attendance_records').select('attendance_date,check_in_time,check_out_time,employees!inner(first_name,last_name,employee_code,department)');
        if (expFrom) q = q.gte('attendance_date', expFrom);
        if (expTo) q = q.lte('attendance_date', expTo);
        const { data } = await q.order('attendance_date', { ascending: false });
        rows = (data || []).map(r => ({ 'Date': r.attendance_date, 'Employee': `${r.employees.first_name} ${r.employees.last_name}`, 'Code': r.employees.employee_code, 'Department': r.employees.department, 'Check In': r.check_in_time?.slice(0, 5) || '', 'Check Out': r.check_out_time?.slice(0, 5) || '' }));
        sheetName = 'Attendance'; fileName = `attendance_${nowISO()}.xlsx`;
      } else if (expType === 'employees') {
        const { data } = await supabase.from('employees').select('employee_code,first_name,last_name,email,department,job_title,status').order('employee_code');
        rows = (data || []).map(r => ({ 'Code': r.employee_code, 'Name': `${r.first_name} ${r.last_name}`, 'Email': r.email, 'Department': r.department, 'Position': r.job_title, 'Status': r.status }));
        sheetName = 'Employees'; fileName = `employees_${nowISO()}.xlsx`;
      } else {
        let q = supabase.from('leave_requests').select('leave_type,start_date,end_date,total_days,reason,status,created_at,employees!inner(first_name,last_name,department)');
        if (expFrom) q = q.gte('start_date', expFrom);
        if (expTo) q = q.lte('start_date', expTo);
        const { data } = await q.order('created_at', { ascending: false });
        rows = (data || []).map(r => ({ 'Employee': `${r.employees.first_name} ${r.employees.last_name}`, 'Type': r.leave_type, 'Start': r.start_date, 'End': r.end_date, 'Days': r.total_days, 'Reason': r.reason, 'Status': r.status }));
        sheetName = 'Leaves'; fileName = `leaves_${nowISO()}.xlsx`;
      }
      if (rows.length === 0) { setExpLoading(false); return Alert.alert('', lang === 'ar' ? 'لا توجد بيانات' : 'No data found.'); }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, fileName);
    } catch (e) { Alert.alert('Error', e.message); }
    setExpLoading(false);
  };

  const stCfg = s => ({
    approved: { color: t.green, bg: t.greenDim, label: 'Approved' },
    present: { color: t.green, bg: t.greenDim, label: 'Present' },
    rejected: { color: t.red, bg: t.redDim, label: 'Rejected' },
    pending: { color: t.amber, bg: t.amberDim, label: 'Pending' },
  }[s] || { color: t.sub, bg: t.border, label: s });

  const filteredEmps = useMemo(() =>
    employees.filter(e =>
      empSearch === '' ||
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.employee_code?.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.department?.toLowerCase().includes(empSearch.toLowerCase())
    ), [employees, empSearch]);

  const tabs = [
    { id: 'overview', label: l.overview, icon: '📊' },
    { id: 'attendance', label: l.attendance_tab, icon: '📍' },
    { id: 'leaves', label: l.leaves_tab, icon: '🌴' },
    { id: 'employees', label: l.employees_tab, icon: '👥' },
    { id: 'notifications', label: l.notifs_tab, icon: '🔔' },
    { id: 'export', label: l.export_tab, icon: '📤' },
  ];

  const HRStat = ({ icon, label, value, color, bg }) => (
    <View style={{
      flex: 1, backgroundColor: t.card, borderRadius: 18, padding: IS_SMALL ? 14 : 18,
      borderWidth: 1, borderColor: t.border, ...shadow('sm'),
    }}>
      <View style={{
        width: 42, height: 42, borderRadius: 13, backgroundColor: bg,
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
      }}>
        <Text style={{ fontSize: IS_SMALL ? 17 : 20 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: IS_SMALL ? 20 : 26, fontWeight: '800', color, marginBottom: 2 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: t.sub, lineHeight: 15 }}>{label}</Text>
    </View>
  );

  const HRBadge = ({ label, color, bg }) => (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: bg, borderWidth: 1, borderColor: `${color}22` }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
    </View>
  );

  const HRCard = ({ children, hl }) => (
    <View style={{
      backgroundColor: t.card, borderRadius: 18, padding: 18, marginBottom: 10,
      borderWidth: 1, borderColor: hl ? `${t.amber}40` : t.border, ...shadow('sm'),
    }}>{children}</View>
  );

  const HREmpRow = ({ e }) => (
    <View style={{
      backgroundColor: t.card, borderRadius: 16, padding: IS_SMALL ? 12 : 15,
      marginBottom: 8, borderWidth: 1, borderColor: t.border,
      flexDirection: 'row', alignItems: 'center', ...shadow('sm'),
    }}>
      <View style={{
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: t.skyDim, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: t.skyBorder,
      }}>
        <Text style={{ color: t.sky, fontWeight: '700', fontSize: 16 }}>
          {e.first_name?.[0]}{e.last_name?.[0]}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>
          {e.first_name} {e.last_name}
        </Text>
        <Text style={{ color: t.sub, fontSize: 11, marginTop: 2 }}>
          {e.job_title} · {e.department}
        </Text>
      </View>
      <HRBadge
        label={e.status === 'active' ? l.active_st : l.inactive_st}
        color={e.status === 'active' ? t.green : t.red}
        bg={e.status === 'active' ? t.greenDim : t.redDim}
      />
    </View>
  );

  if (loading) return (
    <View style={{
      flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center',
      paddingTop: insets.top,
    }}>
      <ActivityIndicator size="large" color={t.sky} />
      <Text style={{ color: t.sub, marginTop: 14, fontSize: 13 }}>{l.loading}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {!isConnected && <OfflineBanner dark={dark} lang={lang} />}
      {/* Header */}
      <View style={{
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
        backgroundColor: t.card, borderBottomWidth: 1, borderBottomColor: t.border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        ...shadow('sm'),
      }}>
        <View>
          <Text style={{ fontSize: IS_SMALL ? 17 : 20, fontWeight: '800', color: t.text, letterSpacing: -0.3 }}>{l.hr_dashboard}</Text>
          <Text style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>
            {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={goBack}
          style={{
            backgroundColor: t.skyDim, paddingHorizontal: 14, paddingVertical: 9,
            borderRadius: 12, borderWidth: 1, borderColor: t.skyBorder,
          }}
        >
          <Text style={{ color: t.sky, fontWeight: '700', fontSize: 13 }}>‹ {l.back}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={{ backgroundColor: t.card, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 6 }}
        >
          {tabs.map(tb => (
            <TouchableOpacity
              key={tb.id} onPress={() => setTab(tb.id)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                backgroundColor: tab === tb.id ? t.sky : 'transparent',
                borderWidth: tab === tb.id ? 0 : 1, borderColor: t.border,
              }}
            >
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: tab === tb.id ? '#fff' : t.sub,
              }}>{tb.icon} {tb.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.sky} colors={[t.sky]} />
        }
      >
        {/* ── OVERVIEW ── */}
        {tab === 'overview' && <>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <HRStat icon="👥" label={l.total_employees} value={stats.total} color={t.sky} bg={t.skyDim} />
            <HRStat icon="✅" label={l.present} value={stats.present} color={t.green} bg={t.greenDim} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <HRStat icon="❌" label={l.absent} value={stats.absent} color={t.red} bg={t.redDim} />
            <HRStat icon="🌴" label={l.pending_leaves} value={stats.pendingLeaves} color={t.amber} bg={t.amberDim} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {[
              { label: l.review_att, g: 'attendance', icon: '📍', c: t.sky, bg: t.skyDim },
              { label: l.leave_req, g: 'leaves', icon: '🌴', c: t.amber, bg: t.amberDim },
              { label: l.emp_list, g: 'employees', icon: '👥', c: t.green, bg: t.greenDim },
              { label: l.send_notif, g: 'notifications', icon: '🔔', c: t.indigo, bg: t.indigoDim },
            ].map(a => (
              <TouchableOpacity
                key={a.g} onPress={() => setTab(a.g)}
                style={{
                  width: '48%', borderRadius: 16, padding: IS_SMALL ? 14 : 18,
                  borderWidth: 1, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: a.bg, borderColor: `${a.c}22`, ...shadow('sm'),
                }}
              >
                <Text style={{ fontSize: IS_SMALL ? 22 : 26, marginBottom: 8 }}>{a.icon}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', textAlign: 'center', color: a.c }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 12 }}>{l.latest_att}</Text>
          {attendance.slice(0, 4).map(a => (
            <View key={a.id} style={{
              backgroundColor: t.card, borderRadius: 14, padding: 14, marginBottom: 8,
              borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center',
              ...shadow('sm'),
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22, backgroundColor: t.skyDim,
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
                borderWidth: 1, borderColor: t.skyBorder,
              }}>
                <Text style={{ color: t.sky, fontWeight: '700', fontSize: 15 }}>
                  {a.employees?.first_name?.[0]}{a.employees?.last_name?.[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>
                  {a.employees?.first_name} {a.employees?.last_name}
                </Text>
                <Text style={{ color: t.sub, fontSize: 11, marginTop: 2 }}>{a.employees?.department}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: t.green, fontSize: 15, fontWeight: '700' }}>{a.check_in_time?.slice(0, 5) || '--:--'}</Text>
                <Text style={{ color: t.sub, fontSize: 10, marginTop: 2 }}>{l.entry}</Text>
              </View>
            </View>
          ))}
          {attendance.length === 0 && (
            <View style={{
              alignItems: 'center', padding: 32, backgroundColor: t.card,
              borderRadius: 16, borderWidth: 1, borderColor: t.border,
            }}>
              <Text style={{ fontSize: 44, marginBottom: 8 }}>📭</Text>
              <Text style={{ color: t.sub, fontSize: 14 }}>{l.no_att_today}</Text>
            </View>
          )}
        </>}

        {/* ── ATTENDANCE ── */}
        {tab === 'attendance' && <>
          <Text style={{ fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 12 }}>
            {l.att_records} ({attendance.length})
          </Text>
          {attendance.map(a => {
            const st = stCfg(a.status);
            return (
              <HRCard key={a.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <View>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 15, marginBottom: 2 }}>
                      {a.employees?.first_name} {a.employees?.last_name}
                    </Text>
                    <Text style={{ color: t.sub, fontSize: 11 }}>{a.employees?.employee_code} · {a.employees?.department}</Text>
                  </View>
                  <HRBadge label={st.label} color={st.color} bg={st.bg} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: t.greenDim, borderWidth: 1, borderColor: `${t.green}20` }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: t.green, marginBottom: 4, letterSpacing: 0.5 }}>{l.entry}</Text>
                    <Text style={{ fontWeight: '700', fontSize: IS_SMALL ? 15 : 17, color: t.green }}>{a.check_in_time?.slice(0, 5) || '---'}</Text>
                  </View>
                  <View style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: t.redDim, borderWidth: 1, borderColor: `${t.red}20` }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: t.red, marginBottom: 4, letterSpacing: 0.5 }}>{l.exit}</Text>
                    <Text style={{ fontWeight: '700', fontSize: IS_SMALL ? 15 : 17, color: a.check_out_time ? t.red : t.muted }}>{a.check_out_time?.slice(0, 5) || '---'}</Text>
                  </View>
                </View>
              </HRCard>
            );
          })}
          {attendance.length === 0 && (
            <View style={{ alignItems: 'center', padding: 32, backgroundColor: t.card, borderRadius: 16, borderWidth: 1, borderColor: t.border }}>
              <Text style={{ fontSize: 44, marginBottom: 8 }}>📭</Text>
              <Text style={{ color: t.sub }}>{l.no_records}</Text>
            </View>
          )}
        </>}

        {/* ── LEAVES ── */}
        {tab === 'leaves' && <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{l.leave_reqs}</Text>
            <Badge dark={dark} label={`${leaveRequests.filter(lv => lv.status === 'pending').length} ${l.under_review}`} color={t.amber} />
          </View>
          {leaveLoading && <ActivityIndicator color={t.sky} style={{ marginBottom: 10 }} />}
          {leaveRequests.map(lv => {
            const st = stCfg(lv.status);
            const days = lv.start_date && lv.end_date ? Math.ceil((new Date(lv.end_date) - new Date(lv.start_date)) / 86400000) + 1 : 0;
            return (
              <HRCard key={lv.id} hl={lv.status === 'pending'}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 15, marginBottom: 2 }}>
                      {lv.employees?.first_name} {lv.employees?.last_name}
                    </Text>
                    <Text style={{ color: t.sub, fontSize: 11 }}>{lv.employees?.department}</Text>
                  </View>
                  <HRBadge label={st.label} color={st.color} bg={st.bg} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: t.indigoDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: `${t.indigo}20` }}>
                    <Text style={{ color: t.indigo, fontSize: 11, fontWeight: '600' }}>{lv.leave_type}</Text>
                  </View>
                  <View style={{ backgroundColor: t.skyDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: `${t.sky}20` }}>
                    <Text style={{ color: t.sky, fontSize: 11, fontWeight: '600' }}>{days} {l.day}</Text>
                  </View>
                </View>
                <Text style={{ color: t.sub, fontSize: 12, marginBottom: 4 }}>📅 {lv.start_date} → {lv.end_date}</Text>
                {lv.reason && <Text style={{ color: t.muted, fontSize: 11, marginBottom: 12, lineHeight: 17 }}>💬 {lv.reason}</Text>}
                {lv.status === 'pending' && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => handleLeaveAction(lv.id, 'approved')}
                      style={{
                        flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
                        backgroundColor: t.greenDim, borderWidth: 1, borderColor: `${t.green}30`,
                      }}
                    >
                      <Text style={{ fontWeight: '700', fontSize: 13, color: t.green }}>✓ {l.approve}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleLeaveAction(lv.id, 'rejected')}
                      style={{
                        flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
                        backgroundColor: t.redDim, borderWidth: 1, borderColor: `${t.red}30`,
                      }}
                    >
                      <Text style={{ fontWeight: '700', fontSize: 13, color: t.red }}>✗ {l.reject}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </HRCard>
            );
          })}
        </>}

        {/* ── EMPLOYEES ── */}
        {tab === 'employees' && <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{l.emp_list_title}</Text>
            <Badge dark={dark} label={`${employees.length} ${l.employee_word}`} color={t.sky} />
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: t.card,
            borderRadius: 14, borderWidth: 1.5, borderColor: t.border,
            paddingHorizontal: 14, marginBottom: 14, ...shadow('sm'),
          }}>
            <Text style={{ fontSize: 15, marginRight: 8 }}>🔍</Text>
            <TextInput
              value={empSearch}
              onChangeText={setEmpSearch}
              placeholder={l.search_emp}
              placeholderTextColor={t.muted}
              style={{ flex: 1, color: t.text, paddingVertical: 13, fontSize: 14 }}
            />
          </View>
          {filteredEmps.map(e => <HREmpRow key={e.id} e={e} />)}
        </>}

        {/* ── NOTIFICATIONS ── */}
        {tab === 'notifications' && <>
          <Text style={{ fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 16 }}>{l.send_notif_title}</Text>
          <HRCard>
            <Text style={{ color: t.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{l.notif_type}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              {[{ id: 'announcement', label: l.announcement, icon: '📢' }, { id: 'reminder', label: l.reminder, icon: '⏰' }, { id: 'alert', label: l.alert, icon: '🚨' }].map(nt => (
                <TouchableOpacity
                  key={nt.id} onPress={() => setNotifType(nt.id)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: notifType === nt.id ? t.indigo : t.border,
                    backgroundColor: notifType === nt.id ? t.indigoDim : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 16, marginBottom: 4 }}>{nt.icon}</Text>
                  <Text style={{ fontSize: 11, color: notifType === nt.id ? t.indigo : t.sub, fontWeight: '600' }}>{nt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: t.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{l.notif_text}</Text>
            <TextInput
              value={notifMsg}
              onChangeText={setNotifMsg}
              placeholder={l.write_text}
              placeholderTextColor={t.muted}
              multiline
              style={{
                backgroundColor: t.inputBg, borderRadius: 14, padding: 14,
                color: t.text, fontSize: 14, borderWidth: 1.5, borderColor: t.border,
                minHeight: 110, textAlignVertical: 'top', marginBottom: 16, lineHeight: 22,
              }}
            />
            <TouchableOpacity
              onPress={sendNotification} disabled={notifSending || !isConnected}
              style={{
                backgroundColor: t.indigo, borderRadius: 14, padding: 15,
                alignItems: 'center', opacity: (notifSending || !isConnected) ? 0.5 : 1, ...shadow('md'),
              }}
            >
              {notifSending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>📤 {l.send_all}</Text>
              }
            </TouchableOpacity>
          </HRCard>
          <View style={{
            marginTop: 14, backgroundColor: t.indigoDim, borderRadius: 16,
            padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16,
            borderWidth: 1, borderColor: `${t.indigo}22`,
          }}>
            <Text style={{ fontSize: 34 }}>👥</Text>
            <View>
              <Text style={{ color: t.indigo, fontWeight: '600', fontSize: 13, marginBottom: 2 }}>{l.will_send_to}</Text>
              <Text style={{ color: t.text, fontSize: IS_SMALL ? 20 : 24, fontWeight: '800' }}>
                {stats.total} {l.employee_word}
              </Text>
            </View>
          </View>
        </>}

        {/* ── EXPORT ── */}
        {tab === 'export' && <>
          <Text style={{ fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 16 }}>📤 {l.export_tab}</Text>
          <HRCard>
            <Text style={{ color: t.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{l.select_type}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              {[{ id: 'attendance', icon: '📍', label: l.attendance_tab }, { id: 'employees', icon: '👥', label: l.employees_tab }, { id: 'leaves', icon: '🌴', label: l.leaves_tab }].map(et => (
                <TouchableOpacity
                  key={et.id} onPress={() => setExpType(et.id)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: expType === et.id ? t.sky : t.border,
                    backgroundColor: expType === et.id ? t.skyDim : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 5 }}>{et.icon}</Text>
                  <Text style={{ fontSize: 11, color: expType === et.id ? t.sky : t.sub, fontWeight: '600' }}>{et.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {expType !== 'employees' && (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{l.from_date}</Text>
                  <CalendarPicker dark={dark} value={expFrom} onChange={setExpFrom} lang={lang} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{l.to_date}</Text>
                  <CalendarPicker dark={dark} value={expTo} onChange={setExpTo} lang={lang} />
                </View>
              </View>
            )}
            <AppBtn dark={dark} label={l.generate_download} icon="📥" color={t.sky} loading={expLoading} disabled={!isConnected} onPress={handleExport} />
            {Platform.OS !== 'web' && (
              <Text style={{ color: t.amber, fontSize: 11, marginTop: 12, textAlign: 'center', lineHeight: 16 }}>
                ⚠️ {lang === 'ar' ? 'التصدير متاح على المتصفح فقط' : 'Export is available on web browser only.'}
              </Text>
            )}
          </HRCard>
        </>}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

/* ═══════════════════ MAIN APP ═══════════════════ */
export default function App() {
  console.log('=== APP START ===');
  const [screen, setScreen] = useState('login');
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [session, setSession] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [employeeRole, setEmployeeRole] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shiftStart, setShiftStart] = useState('09:15:00');
  const isConnected = useNetworkStatus();
  const sessionRefreshTimer = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('app_lang').then(saved => { if (saved) setLang(saved); });
    AsyncStorage.getItem('app_dark_mode').then(saved => { if (saved !== null) setDarkMode(saved === 'true'); });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) setScreen('home');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) {
        setScreen('home');
      } else {
        setScreen('login');
        setEmployee(null);
        setEmployeeRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Session auto-refresh every 10 minutes
  useEffect(() => {
    if (!session) {
      if (sessionRefreshTimer.current) clearInterval(sessionRefreshTimer.current);
      return;
    }
    sessionRefreshTimer.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.log('Session refresh failed:', error.message);
          // Session truly expired — force logout
          Alert.alert(
            L[lang].session_expired,
            L[lang].session_expired_msg,
            [{ text: 'OK', onPress: () => supabase.auth.signOut() }]
          );
        } else if (data?.session) {
          setSession(data.session);
        }
      } catch (e) {
        console.log('Session refresh error:', e.message);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      if (sessionRefreshTimer.current) clearInterval(sessionRefreshTimer.current);
    };
  }, [session, lang]);

  const handleSetDarkMode = useCallback((val) => {
    setDarkMode(val);
    AsyncStorage.setItem('app_dark_mode', val.toString());
  }, []);

  const handleSetLang = useCallback((newLang) => {
    setLang(newLang);
    AsyncStorage.setItem('app_lang', newLang);
  }, []);

  // Fetch employee data
  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { data } = await supabase.from('employees').select('*').eq('email', session.user.email);
      if (data?.length > 0) setEmployee(data[0]);
    })();
  }, [session]);

  // Fetch shift timing from database
  useEffect(() => {
    if (!employee?.id) return;
    (async () => {
      // Try to get shift timing from office_location or a shifts table
      try {
        const { data: officeData } = await supabase
          .from('office_location')
          .select('shift_start_time')
          .eq('is_active', true)
          .single();
        if (officeData?.shift_start_time) {
          // Add 15 min grace period
          const parts = officeData.shift_start_time.split(':');
          const shiftDate = new Date(2000, 0, 1, parseInt(parts[0]), parseInt(parts[1]) + 15, 0);
          const threshold = `${String(shiftDate.getHours()).padStart(2, '0')}:${String(shiftDate.getMinutes()).padStart(2, '0')}:00`;
          setShiftStart(threshold);
        }
      } catch (e) {
        // Column might not exist — use default
        setShiftStart('09:15:00');
      }

      if (employee.role_id) {
        const { data } = await supabase.from('roles').select('name').eq('id', employee.role_id).single();
        if (data) setEmployeeRole(data.name);
      }
      fetchUnread();
      checkTodayStatus();
    })();
  }, [employee]);

  // Real-time notification listener at app level
  useEffect(() => {
    if (!employee?.id) return;
    const channel = supabase
      .channel('app-notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new;
          if (n.employee_id === employee.id || n.employee_id === null) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [employee]);

  const fetchUnread = useCallback(async () => {
    if (!employee?.id) return;
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true })
      .or(`employee_id.eq.${employee.id},employee_id.is.null`).eq('is_read', false);
    setUnreadCount(count || 0);
  }, [employee]);

  const checkTodayStatus = useCallback(async () => {
    if (!employee?.id) return;
    const { data } = await supabase.from('attendance_records').select('*')
      .eq('employee_id', employee.id).eq('attendance_date', nowISO()).maybeSingle();
    setIsClockedIn(!!(data && data.check_in_time && !data.check_out_time));
  }, [employee]);

  const getOffice = async () => {
    try {
      const { data: officeArr } = await supabase.from('office_location').select('*').eq('is_active', true).limit(1); const data = officeArr?.[0] || null;
      return data;
    } catch (e) {
      console.error('getOffice error:', e);
      return null;
    }
  };

  const getUserLoc = async () => {
    if (Platform.OS === 'web') {
      return new Promise(res => {
        if (!navigator.geolocation) { res(null); return; }
        const safetyTimer = setTimeout(() => { res(null); }, 12000);
        navigator.geolocation.getCurrentPosition(
          p => { clearTimeout(safetyTimer); res({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy || 0 }); },
          () => { clearTimeout(safetyTimer); res(null); },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      let loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000)),
      ]);
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude, accuracy: loc.coords.accuracy || 0 };
    } catch (e) {
      try {
        let loc2 = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        return { latitude: loc2.coords.latitude, longitude: loc2.coords.longitude, accuracy: loc2.coords.accuracy || 0 };
      } catch (_) { return null; }
    }
  };

  // Biometric verification helper
  const verifyBiometric = async () => {
    if (!LocalAuthentication) return true; // Not available, skip
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return true; // No hardware, skip
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) return true; // No biometrics enrolled, skip
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: L[lang].biometric_prompt,
        cancelLabel: L[lang].cancel,
        disableDeviceFallback: false,
      });
      return result.success;
    } catch (e) {
      console.log('Biometric error:', e);
      return true; // On error, allow through
    }
  };
const nav = useCallback((s) => {
  if (s === 'refresh') {
    checkTodayStatus();
    fetchUnread();
    return;
  }
  setScreen(s);
}, [checkTodayStatus, fetchUnread]);
  
  const handleCheckIn = async () => {
    if (!employee) return;
    if (!isConnected) return Alert.alert(L[lang].no_internet, L[lang].no_internet_sub);

    const bioOk = await verifyBiometric();
    if (!bioOk) {
      Alert.alert('', L[lang].biometric_fail);
      return;
    }

    setCheckingIn(true);
    try {
      const [office, userLoc] = await Promise.all([getOffice(), getUserLoc()]);
      if (!office || !userLoc) {
        Alert.alert(L[lang].loc_error, L[lang].enable_gps);
        return;
      }
      const dist = haversine(userLoc.latitude, userLoc.longitude, office.latitude, office.longitude);
      const gpsAccuracy = userLoc.accuracy || 0;
      const effectiveDist = Math.max(0, dist - gpsAccuracy);

      if (effectiveDist > office.radius_meters) {
        Alert.alert(
          L[lang].out_of_range,
          lang === 'ar'
            ? `أنت على بعد ${dist.toFixed(0)}m من المكتب.\nالنطاق المسموح: ${office.radius_meters}m\nدقة GPS: ±${gpsAccuracy.toFixed(0)}m`
            : `You are ${dist.toFixed(0)}m away.\nMax allowed: ${office.radius_meters}m\nGPS Accuracy: ±${gpsAccuracy.toFixed(0)}m`
        );
        return;
      }
      const today = nowISO(), time = nowTime();
      const { data: existing } = await supabase.from('attendance_records').select('id')
        .eq('employee_id', employee.id).eq('attendance_date', today).maybeSingle();
      if (existing) { Alert.alert('', L[lang].already_in); return; }
      const { error } = await supabase.from('attendance_records').insert([{
        employee_id: employee.id, attendance_date: today, check_in_time: time, office_id: office.id,
      }]);
      if (error) { Alert.alert('Error', error.message); return; }
      Alert.alert(L[lang].checked_in, lang === 'ar' ? `الوقت: ${fmtTime(time)}\nالمسافة: ${dist.toFixed(0)}m` : `Time: ${fmtTime(time)}\nDistance: ${dist.toFixed(0)}m`);
      setIsClockedIn(true);
    } catch (e) {
      console.error('Check-in error:', e);
      Alert.alert(L[lang].loc_error, L[lang].enable_gps);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employee) return;
    if (!isConnected) return Alert.alert(L[lang].no_internet, L[lang].no_internet_sub);
    setCheckingOut(true);
    try {
      const today = nowISO(), time = nowTime();
      const { data: rec } = await supabase.from('attendance_records').select('*')
        .eq('employee_id', employee.id).eq('attendance_date', today).maybeSingle();
      if (!rec) { Alert.alert('', L[lang].not_checked_in); return; }
      if (rec.check_out_time) { Alert.alert('', L[lang].already_out); return; }
      const { error } = await supabase.from('attendance_records').update({ check_out_time: time }).eq('id', rec.id);
      if (error) { Alert.alert('Error', error.message); return; }
      Alert.alert(L[lang].checked_out, lang === 'ar' ? `الوقت: ${fmtTime(time)}` : `Time: ${fmtTime(time)}`);
      setIsClockedIn(false);
    } catch (e) {
      console.error('Check-out error:', e);
      Alert.alert('Error', L[lang].no_internet_sub);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleLogout = useCallback(() => {
    if (Platform.OS === 'web') {
      const l = L[lang];
      const confirmed = window.confirm(l.logout_confirm);
      if (confirmed) supabase.auth.signOut();
      return;
    }
    Alert.alert(
      L[lang].logout_title,
      L[lang].logout_confirm,
      [
        { text: L[lang].no, style: 'cancel' },
        { text: L[lang].yes, style: 'destructive', onPress: () => supabase.auth.signOut() },
      ]
    );
  }, [lang]);

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return <LoginScreen onLogin={() => setScreen('home')} lang={lang} setLang={handleSetLang} />;
      case 'home':
        return (
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <HomeScreen
              dark={darkMode} employee={employee}
              isClockedIn={isClockedIn} checkingIn={checkingIn} checkingOut={checkingOut}
              unreadCount={unreadCount}
              onCheckIn={handleCheckIn} onCheckOut={handleCheckOut}
              onLogout={handleLogout}
              onNav={nav} lang={lang} setLang={handleSetLang}
              isConnected={isConnected}
            />
          </SafeAreaView>
        );
      case 'history':
        return <HistoryScreenComp dark={darkMode} employee={employee} goBack={() => nav('home')} lang={lang} setLang={handleSetLang} isConnected={isConnected} shiftStart={shiftStart} />;
      case 'map':
        return <MyLocationScreenComp dark={darkMode} goBack={() => nav('home')} lang={lang} setLang={handleSetLang} isConnected={isConnected} />;
      case 'leave':
        return <LeaveRequestScreenComp dark={darkMode} employee={employee} goBack={() => nav('home')} lang={lang} setLang={handleSetLang} isConnected={isConnected} />;
      case 'notifications':
        return <NotificationsScreenComp dark={darkMode} employee={employee} goBack={() => nav('home')} onRead={fetchUnread} lang={lang} setLang={handleSetLang} isConnected={isConnected} />;
      case 'profile':
        return <ProfileScreenComp dark={darkMode} employee={employee} goBack={() => nav('home')} setDarkMode={handleSetDarkMode} onChangePassword={() => nav('change_password')} lang={lang} setLang={handleSetLang} isConnected={isConnected} shiftStart={shiftStart} />;
      case 'change_password':
        return <ChangePasswordScreenComp dark={darkMode} goBack={() => nav('home')} lang={lang} setLang={handleSetLang} isConnected={isConnected} />;
      case 'hr_dashboard':
        return <HRDashboardScreenComp dark={darkMode} goBack={() => nav('home')} lang={lang} isConnected={isConnected} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <ErrorBoundary dark={darkMode} lang={lang} onReset={() => setScreen('home')}>
        {renderScreen()}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
