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
  String get splashTagline => 'Buy & sell nearby';

  @override
  String get homeHeadline => 'Welcome to Tarweej';

  @override
  String get homeBody =>
      'Browse live categories from the API, pick your country, then continue.';

  @override
  String get homeTagline =>
      'Discover deals near you — search, browse, and sell in minutes.';

  @override
  String get homeSearchHint => 'Search phones, cars, homes…';

  @override
  String get homeFeedHeading => 'Latest listings';

  @override
  String get homeFeaturedHeading => 'Featured ads';

  @override
  String get homeAllListings => 'All';

  @override
  String get homeFeedEmpty => 'No listings yet';

  @override
  String get homeFeedEmptyHint => 'Try another category or open search.';

  @override
  String get homeFeedRetry => 'Retry';

  @override
  String get homeSellAction => 'Sell';

  @override
  String get homeCategoriesHeading => 'Categories';

  @override
  String get browseCategoriesAction => 'Browse categories';

  @override
  String get listingLocationUnavailable => 'Location TBD';

  @override
  String get listingContactSellerCta => 'Chat with seller';

  @override
  String get listingFavoriteCta => 'Save';

  @override
  String get listingUnfavoriteCta => 'Saved';

  @override
  String get listingGalleryHint => 'Swipe for more photos';

  @override
  String get myListingsRetry => 'Retry';

  @override
  String get favoritesEmptyHint => 'Save listings you like and find them here.';

  @override
  String get categoriesBrowseListings => 'Browse listings';

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

  @override
  String get myListingsTitle => 'My listings';

  @override
  String get myListingsSubtitle =>
      'Manage drafts and published ads from the Tarweej API.';

  @override
  String get myListingsEmpty => 'You have no listings yet.';

  @override
  String get createListingAction => 'Create listing';

  @override
  String get createListingTitle => 'New listing';

  @override
  String get listingDetailTitle => 'Listing';

  @override
  String get listingNotFound => 'Listing not found.';

  @override
  String get listingStatusLabel => 'Status';

  @override
  String get listingViewsLabel => 'Views';

  @override
  String get listingRejectionLabel => 'Rejection reason';

  @override
  String get listingMediaHeading => 'Media';

  @override
  String get listingMediaEmpty => 'No media attached.';

  @override
  String get listingAttributesHeading => 'Attributes';

  @override
  String get listingAttributesEmpty => 'No attributes.';

  @override
  String get listingWizardStep => 'Step';

  @override
  String get listingWizardCategoryStep => 'Choose category';

  @override
  String get listingWizardFieldsStep => 'Details & attributes';

  @override
  String get listingWizardMediaStep => 'Media';

  @override
  String get listingWizardReviewStep => 'Review & submit';

  @override
  String get listingWizardPickCategoryFirst =>
      'Select a category on the previous step.';

  @override
  String get listingWizardMissing => 'Category and country are required.';

  @override
  String get listingWizardFailed => 'Could not create listing.';

  @override
  String get listingWizardBack => 'Back';

  @override
  String get listingWizardNext => 'Next';

  @override
  String get listingWizardSubmit => 'Submit for review';

  @override
  String get listingTitleLabel => 'Title';

  @override
  String get listingDescriptionLabel => 'Description';

  @override
  String get listingPriceLabel => 'Price';

  @override
  String get listingMediaStubHint =>
      'Image picker is stubbed for now — attach a placeholder media file.';

  @override
  String get listingMediaStubAction => 'Attach media stub';

  @override
  String get listingMediaStubReady => 'Media stub ready';

  @override
  String get openMyListings => 'My listings';

  @override
  String get searchTitle => 'Search';

  @override
  String get openSearchAction => 'Search listings';

  @override
  String get searchQueryLabel => 'Search';

  @override
  String get searchQueryHint => 'Title or description';

  @override
  String get searchAction => 'Search';

  @override
  String get searchFiltersAction => 'Filters';

  @override
  String get searchSortLabel => 'Sort';

  @override
  String get searchSortNewest => 'Newest';

  @override
  String get searchSortOldest => 'Oldest';

  @override
  String get searchSortPriceAsc => 'Price: low to high';

  @override
  String get searchSortPriceDesc => 'Price: high to low';

  @override
  String get searchSortViews => 'Most viewed';

  @override
  String get searchSortFeatured => 'Featured first';

  @override
  String get searchCategoryLabel => 'Category';

  @override
  String get searchCityLabel => 'City';

  @override
  String get searchAnyOption => 'Any';

  @override
  String get searchMinPriceLabel => 'Min price';

  @override
  String get searchMaxPriceLabel => 'Max price';

  @override
  String get searchFeaturedOnly => 'Featured only';

  @override
  String get searchAttributesHeading => 'Attribute filters';

  @override
  String get searchApplyFilters => 'Apply filters';

  @override
  String get searchEmpty => 'No listings match your search.';

  @override
  String get searchCachedHint => 'Results served from cache';

  @override
  String get searchPriceUnavailable => 'Price on request';

  @override
  String get searchFeaturedBadge => 'Featured';

  @override
  String get searchPrevPage => 'Previous';

  @override
  String get searchNextPage => 'Next';

  @override
  String searchResultsCount(int count) {
    return '$count results';
  }

  @override
  String get openFavorites => 'Favorites';

  @override
  String get openChat => 'Messages';

  @override
  String get openNotifications => 'Notifications';

  @override
  String get favoritesTitle => 'Favorites';

  @override
  String get favoritesEmpty => 'You have no favorite listings yet.';

  @override
  String get favoritesRetry => 'Retry';

  @override
  String get favoritesAddAction => 'Add to favorites';

  @override
  String get favoritesRemoveAction => 'Remove favorite';

  @override
  String get favoritesAvailable => 'Available';

  @override
  String get favoritesExpired => 'Expired';

  @override
  String get favoritesDeleted => 'Deleted';

  @override
  String get favoritesUnavailable => 'Unavailable';

  @override
  String get chatTitle => 'Messages';

  @override
  String get chatThreadTitle => 'Conversation';

  @override
  String get chatEmpty => 'No conversations yet.';

  @override
  String get chatRetry => 'Retry';

  @override
  String get chatNoMessagesYet => 'No messages yet.';

  @override
  String get chatMessageHint => 'Type a message';

  @override
  String get chatSendAction => 'Send';

  @override
  String get chatContactSeller => 'Contact seller';

  @override
  String chatUnreadCount(int count) {
    return '$count unread';
  }

  @override
  String get promoteListingAction => 'Promote listing';

  @override
  String get promoteTitle => 'Promote listing';

  @override
  String get promoteSubtitle =>
      'Feature your listing with an hourly paid promotion. Payment is confirmed by the server — not the client.';

  @override
  String get promoteNoPlans =>
      'No promotion plans are available for your country yet.';

  @override
  String get promotePlanLabel => 'Plan';

  @override
  String get promoteDurationLabel => 'Duration';

  @override
  String promoteTotalLabel(String amount, String currency) {
    return 'Total: $amount $currency';
  }

  @override
  String get promoteContinueAction => 'Continue to payment';

  @override
  String get paymentResultTitle => 'Payment result';

  @override
  String get paymentResultSuccess => 'Payment successful — featured is active';

  @override
  String get paymentResultPending => 'Awaiting payment confirmation';

  @override
  String get paymentStatusLabel => 'Status';

  @override
  String get paymentAmountLabel => 'Amount';

  @override
  String get paymentProviderLabel => 'Provider';

  @override
  String get promotionStatusLabel => 'Promotion';

  @override
  String get promotionEndsLabel => 'Ends at';

  @override
  String get paymentSimulatePaidAction => 'Simulate paid (sandbox)';

  @override
  String get paymentBackToListingAction => 'Back to listing';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get notificationsEmpty => 'No notifications yet.';

  @override
  String get notificationsRetry => 'Retry';

  @override
  String get notificationsMarkRead => 'Mark read';

  @override
  String get notificationsMarkAllRead => 'Mark all read';

  @override
  String get reportListingAction => 'Report listing';

  @override
  String get reportListingTitle => 'Report listing';

  @override
  String get reportReasonSpam => 'Spam';

  @override
  String get reportReasonFraud => 'Fraud';

  @override
  String get reportReasonInappropriate => 'Inappropriate';

  @override
  String get reportReasonCounterfeit => 'Counterfeit';

  @override
  String get reportReasonHarassment => 'Harassment';

  @override
  String get reportReasonOther => 'Other';

  @override
  String get reportNotesHint => 'Optional details';

  @override
  String get reportSubmitAction => 'Submit report';

  @override
  String get reportSuccessMessage => 'Report submitted. Thank you.';
}
