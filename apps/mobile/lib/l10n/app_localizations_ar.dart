// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'ترويج';

  @override
  String get splashTagline => 'أساس منصة السوق';

  @override
  String get homeHeadline => 'مرحبًا بك في ترويج';

  @override
  String get homeBody =>
      'مرحلة البيانات المرجعية — اختر بلدك من الواجهة البرمجية ثم تابع.';

  @override
  String get countrySelectTitle => 'اختر بلدك';

  @override
  String get countrySelectSubtitle =>
      'تُحمَّل البلدان من واجهة البيانات المرجعية (الأسواق النشطة فقط).';

  @override
  String get countrySelectRetry => 'إعادة المحاولة';

  @override
  String get selectedCountryLabel => 'البلد المحدد';

  @override
  String get changeCountryAction => 'تغيير البلد';

  @override
  String get loginTitle => 'تسجيل الدخول';

  @override
  String get loginSubtitle => 'استخدم بريدك الإلكتروني وكلمة المرور للمتابعة.';

  @override
  String get loginAction => 'دخول';

  @override
  String get registerTitle => 'إنشاء حساب';

  @override
  String get registerSubtitle =>
      'سجّل بالبريد الإلكتروني. لن تُخزَّن كلمات المرور كنص واضح.';

  @override
  String get registerAction => 'إنشاء الحساب';

  @override
  String get otpTitle => 'رمز الهاتف';

  @override
  String get otpSubtitle => 'أدخل رقم هاتفك لاستلام رمز لمرة واحدة.';

  @override
  String get otpRequestAction => 'إرسال الرمز';

  @override
  String get otpVerifyAction => 'تحقق وسجّل الدخول';

  @override
  String get otpSent => 'تم إرسال رمز التحقق.';

  @override
  String get otpCodeLabel => 'رمز التحقق';

  @override
  String get emailLabel => 'البريد الإلكتروني';

  @override
  String get passwordLabel => 'كلمة المرور';

  @override
  String get displayNameLabel => 'الاسم الظاهر';

  @override
  String get phoneLabel => 'الهاتف (E.164)';

  @override
  String get goToRegister => 'ليس لديك حساب؟ سجّل الآن';

  @override
  String get goToLogin => 'لديك حساب؟ سجّل الدخول';

  @override
  String get goToOtp => 'الدخول برمز الهاتف';

  @override
  String get validationEmail => 'أدخل بريدًا إلكترونيًا صالحًا';

  @override
  String get validationPassword => 'يجب أن تكون كلمة المرور 8 أحرف على الأقل';

  @override
  String get validationPhone => 'أدخل رقم هاتف بصيغة E.164';

  @override
  String get validationOtp => 'أدخل رمز التحقق';

  @override
  String get profileTitle => 'الملف الشخصي';

  @override
  String get profileSubtitle => 'حدّث اسمك الظاهر وراجع بيانات الحساب.';

  @override
  String get profileSaveAction => 'حفظ الملف';

  @override
  String get profileSaved => 'تم حفظ الملف';

  @override
  String get profileEmpty => 'أنت غير مسجّل الدخول.';

  @override
  String get logoutAction => 'تسجيل الخروج';

  @override
  String get signedInAs => 'مسجّل باسم';

  @override
  String get openProfile => 'فتح الملف الشخصي';

  @override
  String get guestLabel => 'زائر';
}
