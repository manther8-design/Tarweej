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
  /// **'Browse live categories from the API, pick your country, then continue.'**
  String get homeBody;

  /// No description provided for @homeCategoriesHeading.
  ///
  /// In en, this message translates to:
  /// **'Categories'**
  String get homeCategoriesHeading;

  /// No description provided for @browseCategoriesAction.
  ///
  /// In en, this message translates to:
  /// **'Browse categories'**
  String get browseCategoriesAction;

  /// No description provided for @categoriesTitle.
  ///
  /// In en, this message translates to:
  /// **'Categories'**
  String get categoriesTitle;

  /// No description provided for @categoriesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Hierarchy loaded from the Tarweej catalog API.'**
  String get categoriesSubtitle;

  /// No description provided for @categoriesRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get categoriesRetry;

  /// No description provided for @categoriesEmpty.
  ///
  /// In en, this message translates to:
  /// **'No categories available yet.'**
  String get categoriesEmpty;

  /// No description provided for @categoryDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get categoryDetailTitle;

  /// No description provided for @categorySlugLabel.
  ///
  /// In en, this message translates to:
  /// **'Slug'**
  String get categorySlugLabel;

  /// No description provided for @categoryListingTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'Listing type'**
  String get categoryListingTypeLabel;

  /// No description provided for @categoryAttributesHeading.
  ///
  /// In en, this message translates to:
  /// **'Attributes'**
  String get categoryAttributesHeading;

  /// No description provided for @categoryAttributesEmpty.
  ///
  /// In en, this message translates to:
  /// **'No attributes for this category.'**
  String get categoryAttributesEmpty;

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

  /// No description provided for @myListingsTitle.
  ///
  /// In en, this message translates to:
  /// **'My listings'**
  String get myListingsTitle;

  /// No description provided for @myListingsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Manage drafts and published ads from the Tarweej API.'**
  String get myListingsSubtitle;

  /// No description provided for @myListingsEmpty.
  ///
  /// In en, this message translates to:
  /// **'You have no listings yet.'**
  String get myListingsEmpty;

  /// No description provided for @createListingAction.
  ///
  /// In en, this message translates to:
  /// **'Create listing'**
  String get createListingAction;

  /// No description provided for @createListingTitle.
  ///
  /// In en, this message translates to:
  /// **'New listing'**
  String get createListingTitle;

  /// No description provided for @listingDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Listing'**
  String get listingDetailTitle;

  /// No description provided for @listingNotFound.
  ///
  /// In en, this message translates to:
  /// **'Listing not found.'**
  String get listingNotFound;

  /// No description provided for @listingStatusLabel.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get listingStatusLabel;

  /// No description provided for @listingViewsLabel.
  ///
  /// In en, this message translates to:
  /// **'Views'**
  String get listingViewsLabel;

  /// No description provided for @listingRejectionLabel.
  ///
  /// In en, this message translates to:
  /// **'Rejection reason'**
  String get listingRejectionLabel;

  /// No description provided for @listingMediaHeading.
  ///
  /// In en, this message translates to:
  /// **'Media'**
  String get listingMediaHeading;

  /// No description provided for @listingMediaEmpty.
  ///
  /// In en, this message translates to:
  /// **'No media attached.'**
  String get listingMediaEmpty;

  /// No description provided for @listingAttributesHeading.
  ///
  /// In en, this message translates to:
  /// **'Attributes'**
  String get listingAttributesHeading;

  /// No description provided for @listingAttributesEmpty.
  ///
  /// In en, this message translates to:
  /// **'No attributes.'**
  String get listingAttributesEmpty;

  /// No description provided for @listingWizardStep.
  ///
  /// In en, this message translates to:
  /// **'Step'**
  String get listingWizardStep;

  /// No description provided for @listingWizardCategoryStep.
  ///
  /// In en, this message translates to:
  /// **'Choose category'**
  String get listingWizardCategoryStep;

  /// No description provided for @listingWizardFieldsStep.
  ///
  /// In en, this message translates to:
  /// **'Details & attributes'**
  String get listingWizardFieldsStep;

  /// No description provided for @listingWizardMediaStep.
  ///
  /// In en, this message translates to:
  /// **'Media'**
  String get listingWizardMediaStep;

  /// No description provided for @listingWizardReviewStep.
  ///
  /// In en, this message translates to:
  /// **'Review & submit'**
  String get listingWizardReviewStep;

  /// No description provided for @listingWizardPickCategoryFirst.
  ///
  /// In en, this message translates to:
  /// **'Select a category on the previous step.'**
  String get listingWizardPickCategoryFirst;

  /// No description provided for @listingWizardMissing.
  ///
  /// In en, this message translates to:
  /// **'Category and country are required.'**
  String get listingWizardMissing;

  /// No description provided for @listingWizardFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not create listing.'**
  String get listingWizardFailed;

  /// No description provided for @listingWizardBack.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get listingWizardBack;

  /// No description provided for @listingWizardNext.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get listingWizardNext;

  /// No description provided for @listingWizardSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit for review'**
  String get listingWizardSubmit;

  /// No description provided for @listingTitleLabel.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get listingTitleLabel;

  /// No description provided for @listingDescriptionLabel.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get listingDescriptionLabel;

  /// No description provided for @listingPriceLabel.
  ///
  /// In en, this message translates to:
  /// **'Price'**
  String get listingPriceLabel;

  /// No description provided for @listingMediaStubHint.
  ///
  /// In en, this message translates to:
  /// **'Image picker is stubbed for now — attach a placeholder media file.'**
  String get listingMediaStubHint;

  /// No description provided for @listingMediaStubAction.
  ///
  /// In en, this message translates to:
  /// **'Attach media stub'**
  String get listingMediaStubAction;

  /// No description provided for @listingMediaStubReady.
  ///
  /// In en, this message translates to:
  /// **'Media stub ready'**
  String get listingMediaStubReady;

  /// No description provided for @openMyListings.
  ///
  /// In en, this message translates to:
  /// **'My listings'**
  String get openMyListings;

  /// No description provided for @searchTitle.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get searchTitle;

  /// No description provided for @openSearchAction.
  ///
  /// In en, this message translates to:
  /// **'Search listings'**
  String get openSearchAction;

  /// No description provided for @searchQueryLabel.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get searchQueryLabel;

  /// No description provided for @searchQueryHint.
  ///
  /// In en, this message translates to:
  /// **'Title or description'**
  String get searchQueryHint;

  /// No description provided for @searchAction.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get searchAction;

  /// No description provided for @searchFiltersAction.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get searchFiltersAction;

  /// No description provided for @searchSortLabel.
  ///
  /// In en, this message translates to:
  /// **'Sort'**
  String get searchSortLabel;

  /// No description provided for @searchSortNewest.
  ///
  /// In en, this message translates to:
  /// **'Newest'**
  String get searchSortNewest;

  /// No description provided for @searchSortOldest.
  ///
  /// In en, this message translates to:
  /// **'Oldest'**
  String get searchSortOldest;

  /// No description provided for @searchSortPriceAsc.
  ///
  /// In en, this message translates to:
  /// **'Price: low to high'**
  String get searchSortPriceAsc;

  /// No description provided for @searchSortPriceDesc.
  ///
  /// In en, this message translates to:
  /// **'Price: high to low'**
  String get searchSortPriceDesc;

  /// No description provided for @searchSortViews.
  ///
  /// In en, this message translates to:
  /// **'Most viewed'**
  String get searchSortViews;

  /// No description provided for @searchSortFeatured.
  ///
  /// In en, this message translates to:
  /// **'Featured first'**
  String get searchSortFeatured;

  /// No description provided for @searchCategoryLabel.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get searchCategoryLabel;

  /// No description provided for @searchCityLabel.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get searchCityLabel;

  /// No description provided for @searchAnyOption.
  ///
  /// In en, this message translates to:
  /// **'Any'**
  String get searchAnyOption;

  /// No description provided for @searchMinPriceLabel.
  ///
  /// In en, this message translates to:
  /// **'Min price'**
  String get searchMinPriceLabel;

  /// No description provided for @searchMaxPriceLabel.
  ///
  /// In en, this message translates to:
  /// **'Max price'**
  String get searchMaxPriceLabel;

  /// No description provided for @searchFeaturedOnly.
  ///
  /// In en, this message translates to:
  /// **'Featured only'**
  String get searchFeaturedOnly;

  /// No description provided for @searchAttributesHeading.
  ///
  /// In en, this message translates to:
  /// **'Attribute filters'**
  String get searchAttributesHeading;

  /// No description provided for @searchApplyFilters.
  ///
  /// In en, this message translates to:
  /// **'Apply filters'**
  String get searchApplyFilters;

  /// No description provided for @searchEmpty.
  ///
  /// In en, this message translates to:
  /// **'No listings match your search.'**
  String get searchEmpty;

  /// No description provided for @searchCachedHint.
  ///
  /// In en, this message translates to:
  /// **'Results served from cache'**
  String get searchCachedHint;

  /// No description provided for @searchPriceUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Price on request'**
  String get searchPriceUnavailable;

  /// No description provided for @searchFeaturedBadge.
  ///
  /// In en, this message translates to:
  /// **'Featured'**
  String get searchFeaturedBadge;

  /// No description provided for @searchPrevPage.
  ///
  /// In en, this message translates to:
  /// **'Previous'**
  String get searchPrevPage;

  /// No description provided for @searchNextPage.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get searchNextPage;

  /// No description provided for @searchResultsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} results'**
  String searchResultsCount(int count);

  /// No description provided for @openFavorites.
  ///
  /// In en, this message translates to:
  /// **'Favorites'**
  String get openFavorites;

  /// No description provided for @openChat.
  ///
  /// In en, this message translates to:
  /// **'Messages'**
  String get openChat;

  /// No description provided for @favoritesTitle.
  ///
  /// In en, this message translates to:
  /// **'Favorites'**
  String get favoritesTitle;

  /// No description provided for @favoritesEmpty.
  ///
  /// In en, this message translates to:
  /// **'You have no favorite listings yet.'**
  String get favoritesEmpty;

  /// No description provided for @favoritesRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get favoritesRetry;

  /// No description provided for @favoritesAddAction.
  ///
  /// In en, this message translates to:
  /// **'Add to favorites'**
  String get favoritesAddAction;

  /// No description provided for @favoritesRemoveAction.
  ///
  /// In en, this message translates to:
  /// **'Remove favorite'**
  String get favoritesRemoveAction;

  /// No description provided for @favoritesAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get favoritesAvailable;

  /// No description provided for @favoritesExpired.
  ///
  /// In en, this message translates to:
  /// **'Expired'**
  String get favoritesExpired;

  /// No description provided for @favoritesDeleted.
  ///
  /// In en, this message translates to:
  /// **'Deleted'**
  String get favoritesDeleted;

  /// No description provided for @favoritesUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Unavailable'**
  String get favoritesUnavailable;

  /// No description provided for @chatTitle.
  ///
  /// In en, this message translates to:
  /// **'Messages'**
  String get chatTitle;

  /// No description provided for @chatThreadTitle.
  ///
  /// In en, this message translates to:
  /// **'Conversation'**
  String get chatThreadTitle;

  /// No description provided for @chatEmpty.
  ///
  /// In en, this message translates to:
  /// **'No conversations yet.'**
  String get chatEmpty;

  /// No description provided for @chatRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get chatRetry;

  /// No description provided for @chatNoMessagesYet.
  ///
  /// In en, this message translates to:
  /// **'No messages yet.'**
  String get chatNoMessagesYet;

  /// No description provided for @chatMessageHint.
  ///
  /// In en, this message translates to:
  /// **'Type a message'**
  String get chatMessageHint;

  /// No description provided for @chatSendAction.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get chatSendAction;

  /// No description provided for @chatContactSeller.
  ///
  /// In en, this message translates to:
  /// **'Contact seller'**
  String get chatContactSeller;

  /// No description provided for @chatUnreadCount.
  ///
  /// In en, this message translates to:
  /// **'{count} unread'**
  String chatUnreadCount(int count);
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
