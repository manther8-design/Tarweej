import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
  ];

  /// Application title
  ///
  /// In en, this message translates to:
  /// **'Tarweej'**
  String get appTitle;

  /// No description provided for @splashTagline.
  ///
  /// In en, this message translates to:
  /// **'Marketplace foundation'**
  String get splashTagline;

  /// No description provided for @homeHeadline.
  ///
  /// In en, this message translates to:
  /// **'Welcome to Tarweej'**
  String get homeHeadline;

  /// No description provided for @homeBody.
  ///
  /// In en, this message translates to:
  /// **'Reference data phase — pick your country from the live API, then continue.'**
  String get homeBody;

  /// No description provided for @countrySelectTitle.
  ///
  /// In en, this message translates to:
  /// **'Choose your country'**
  String get countrySelectTitle;

  /// No description provided for @countrySelectSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Countries load from the Tarweej reference API (active markets only).'**
  String get countrySelectSubtitle;

  /// No description provided for @countrySelectRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get countrySelectRetry;

  /// No description provided for @selectedCountryLabel.
  ///
  /// In en, this message translates to:
  /// **'Selected country'**
  String get selectedCountryLabel;

  /// No description provided for @changeCountryAction.
  ///
  /// In en, this message translates to:
  /// **'Change country'**
  String get changeCountryAction;

  /// No description provided for @loginTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Use your email and password to continue.'**
  String get loginSubtitle;

  /// No description provided for @loginAction.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get loginAction;

  /// No description provided for @registerTitle.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get registerTitle;

  /// No description provided for @registerSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Register with email. Passwords are never stored in plaintext.'**
  String get registerSubtitle;

  /// No description provided for @registerAction.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get registerAction;

  /// No description provided for @otpTitle.
  ///
  /// In en, this message translates to:
  /// **'Phone OTP'**
  String get otpTitle;

  /// No description provided for @otpSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your phone number to receive a one-time code.'**
  String get otpSubtitle;

  /// No description provided for @otpRequestAction.
  ///
  /// In en, this message translates to:
  /// **'Send code'**
  String get otpRequestAction;

  /// No description provided for @otpVerifyAction.
  ///
  /// In en, this message translates to:
  /// **'Verify and sign in'**
  String get otpVerifyAction;

  /// No description provided for @otpSent.
  ///
  /// In en, this message translates to:
  /// **'Verification code sent.'**
  String get otpSent;

  /// No description provided for @otpCodeLabel.
  ///
  /// In en, this message translates to:
  /// **'OTP code'**
  String get otpCodeLabel;

  /// No description provided for @emailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @passwordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get passwordLabel;

  /// No description provided for @displayNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Display name'**
  String get displayNameLabel;

  /// No description provided for @phoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Phone (E.164)'**
  String get phoneLabel;

  /// No description provided for @goToRegister.
  ///
  /// In en, this message translates to:
  /// **'Need an account? Register'**
  String get goToRegister;

  /// No description provided for @goToLogin.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? Sign in'**
  String get goToLogin;

  /// No description provided for @goToOtp.
  ///
  /// In en, this message translates to:
  /// **'Sign in with phone OTP'**
  String get goToOtp;

  /// No description provided for @validationEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get validationEmail;

  /// No description provided for @validationPassword.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 8 characters'**
  String get validationPassword;

  /// No description provided for @validationPhone.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid E.164 phone number'**
  String get validationPhone;

  /// No description provided for @validationOtp.
  ///
  /// In en, this message translates to:
  /// **'Enter the OTP code'**
  String get validationOtp;

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profileTitle;

  /// No description provided for @profileSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Update your display name and review account details.'**
  String get profileSubtitle;

  /// No description provided for @profileSaveAction.
  ///
  /// In en, this message translates to:
  /// **'Save profile'**
  String get profileSaveAction;

  /// No description provided for @profileSaved.
  ///
  /// In en, this message translates to:
  /// **'Profile saved'**
  String get profileSaved;

  /// No description provided for @profileEmpty.
  ///
  /// In en, this message translates to:
  /// **'You are not signed in.'**
  String get profileEmpty;

  /// No description provided for @logoutAction.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get logoutAction;

  /// No description provided for @signedInAs.
  ///
  /// In en, this message translates to:
  /// **'Signed in as'**
  String get signedInAs;

  /// No description provided for @openProfile.
  ///
  /// In en, this message translates to:
  /// **'Open profile'**
  String get openProfile;

  /// No description provided for @guestLabel.
  ///
  /// In en, this message translates to:
  /// **'Guest'**
  String get guestLabel;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
