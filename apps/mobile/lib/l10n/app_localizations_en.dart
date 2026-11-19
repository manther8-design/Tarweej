// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Tarweej';

  @override
  String get splashTagline => 'Marketplace foundation';

  @override
  String get homeHeadline => 'Welcome to Tarweej';

  @override
  String get homeBody =>
      'Browse live categories from the API, pick your country, then continue.';

  @override
  String get homeCategoriesHeading => 'Categories';

  @override
  String get browseCategoriesAction => 'Browse categories';

  @override
  String get categoriesTitle => 'Categories';

  @override
  String get categoriesSubtitle =>
      'Hierarchy loaded from the Tarweej catalog API.';

  @override
  String get categoriesRetry => 'Retry';

  @override
  String get categoriesEmpty => 'No categories available yet.';

  @override
  String get categoryDetailTitle => 'Category';

  @override
  String get categorySlugLabel => 'Slug';

  @override
  String get categoryListingTypeLabel => 'Listing type';

  @override
  String get categoryAttributesHeading => 'Attributes';

  @override
  String get categoryAttributesEmpty => 'No attributes for this category.';

  @override
  String get countrySelectTitle => 'Choose your country';

  @override
  String get countrySelectSubtitle =>
      'Countries load from the Tarweej reference API (active markets only).';

  @override
  String get countrySelectRetry => 'Retry';

  @override
  String get selectedCountryLabel => 'Selected country';

  @override
  String get changeCountryAction => 'Change country';

  @override
  String get loginTitle => 'Sign in';

  @override
  String get loginSubtitle => 'Use your email and password to continue.';

  @override
  String get loginAction => 'Sign in';

  @override
  String get registerTitle => 'Create account';

  @override
  String get registerSubtitle =>
      'Register with email. Passwords are never stored in plaintext.';

  @override
  String get registerAction => 'Create account';

  @override
  String get otpTitle => 'Phone OTP';

  @override
  String get otpSubtitle =>
      'Enter your phone number to receive a one-time code.';

  @override
  String get otpRequestAction => 'Send code';

  @override
  String get otpVerifyAction => 'Verify and sign in';

  @override
  String get otpSent => 'Verification code sent.';

  @override
  String get otpCodeLabel => 'OTP code';

  @override
  String get emailLabel => 'Email';

  @override
  String get passwordLabel => 'Password';

  @override
  String get displayNameLabel => 'Display name';

  @override
  String get phoneLabel => 'Phone (E.164)';

  @override
  String get goToRegister => 'Need an account? Register';

  @override
  String get goToLogin => 'Already have an account? Sign in';

  @override
  String get goToOtp => 'Sign in with phone OTP';

  @override
  String get validationEmail => 'Enter a valid email';

  @override
  String get validationPassword => 'Password must be at least 8 characters';

  @override
  String get validationPhone => 'Enter a valid E.164 phone number';

  @override
  String get validationOtp => 'Enter the OTP code';

  @override
  String get profileTitle => 'Profile';

  @override
  String get profileSubtitle =>
      'Update your display name and review account details.';

  @override
  String get profileSaveAction => 'Save profile';

  @override
  String get profileSaved => 'Profile saved';

  @override
  String get profileEmpty => 'You are not signed in.';

  @override
  String get logoutAction => 'Sign out';

  @override
  String get signedInAs => 'Signed in as';

  @override
  String get openProfile => 'Open profile';

  @override
  String get guestLabel => 'Guest';
}
