import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/core/routing/main_shell.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/auth/presentation/login_page.dart';
import 'package:tarweej_mobile/features/auth/presentation/otp_page.dart';
import 'package:tarweej_mobile/features/auth/presentation/register_page.dart';
import 'package:tarweej_mobile/features/catalog/presentation/categories_page.dart';
import 'package:tarweej_mobile/features/catalog/presentation/category_detail_page.dart';
import 'package:tarweej_mobile/features/chat/presentation/chat_list_page.dart';
import 'package:tarweej_mobile/features/chat/presentation/chat_thread_page.dart';
import 'package:tarweej_mobile/features/favorites/presentation/favorites_page.dart';
import 'package:tarweej_mobile/features/home/presentation/home_page.dart';
import 'package:tarweej_mobile/features/listings/presentation/create_listing_wizard_page.dart';
import 'package:tarweej_mobile/features/listings/presentation/listing_detail_page.dart';
import 'package:tarweej_mobile/features/listings/presentation/my_listings_page.dart';
import 'package:tarweej_mobile/features/notifications/presentation/notifications_inbox_page.dart';
import 'package:tarweej_mobile/features/payments/presentation/payment_result_page.dart';
import 'package:tarweej_mobile/features/payments/presentation/promote_listing_page.dart';
import 'package:tarweej_mobile/features/profile/presentation/account_hub_page.dart';
import 'package:tarweej_mobile/features/profile/presentation/profile_page.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/features/reference/presentation/country_select_page.dart';
import 'package:tarweej_mobile/features/search/presentation/search_page.dart';
import 'package:tarweej_mobile/features/sections/presentation/section_detail_page.dart';
import 'package:tarweej_mobile/features/sections/presentation/sections_hub_page.dart';
import 'package:tarweej_mobile/features/splash/presentation/splash_page.dart';

final _routerRefreshProvider = Provider<_RouterRefresh>((ref) {
  final refresh = _RouterRefresh();
  ref.listen<AuthState>(authControllerProvider, (_, __) => refresh.notify());
  ref.listen<ReferenceState>(referenceControllerProvider, (_, __) => refresh.notify());
  return refresh;
});

class _RouterRefresh extends ChangeNotifier {
  void notify() => notifyListeners();
}

bool _needsAuth(String loc, GoRouterState state) {
  return loc == '/profile' ||
      loc == '/my-listings' ||
      loc == '/favorites' ||
      loc == '/notifications' ||
      loc == '/chat' ||
      loc.startsWith('/chat/') ||
      loc == '/listings/create' ||
      (loc.startsWith('/listings/') && loc.endsWith('/promote')) ||
      loc.startsWith('/payments/') ||
      (loc.startsWith('/listings/') && state.uri.queryParameters['mine'] == '1');
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = ref.watch(_routerRefreshProvider);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refresh,
    redirect: (BuildContext context, GoRouterState state) {
      final auth = ref.read(authControllerProvider);
      final reference = ref.read(referenceControllerProvider);
      final loc = state.matchedLocation;
      final isAuthRoute =
          loc == '/login' || loc == '/register' || loc == '/otp' || loc == '/splash';

      if (!auth.bootstrapped || !reference.bootstrapped) {
        return loc == '/splash' ? null : '/splash';
      }

      if (!reference.hasCountry && loc != '/country' && loc != '/splash') {
        return '/country';
      }

      if (!auth.isAuthenticated && _needsAuth(loc, state)) {
        return '/login';
      }

      if (auth.isAuthenticated && isAuthRoute && loc != '/splash') {
        return '/home';
      }

      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (BuildContext context, GoRouterState state) => const SplashPage(),
      ),
      GoRoute(
        path: '/country',
        name: 'country',
        builder: (BuildContext context, GoRouterState state) =>
            const CountrySelectPage(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (BuildContext context, GoRouterState state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (BuildContext context, GoRouterState state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/otp',
        name: 'otp',
        builder: (BuildContext context, GoRouterState state) => const OtpPage(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                name: 'home',
                builder: (context, state) => const HomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/sections',
                name: 'sections',
                builder: (context, state) => const SectionsHubPage(),
                routes: [
                  GoRoute(
                    path: ':slug',
                    name: 'section-detail',
                    builder: (context, state) {
                      final slug = state.pathParameters['slug'] ?? 'general';
                      return SectionDetailPage(slug: slug);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/chat',
                name: 'chat',
                builder: (context, state) => const ChatListPage(),
                routes: [
                  GoRoute(
                    path: ':id',
                    name: 'chat-thread',
                    builder: (context, state) {
                      final id = state.pathParameters['id'] ?? '';
                      return ChatThreadPage(conversationId: id);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/account',
                name: 'account',
                builder: (context, state) => const AccountHubPage(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/search',
        name: 'search',
        builder: (BuildContext context, GoRouterState state) => const SearchPage(),
      ),
      GoRoute(
        path: '/categories',
        name: 'categories',
        builder: (BuildContext context, GoRouterState state) => const CategoriesPage(),
      ),
      GoRoute(
        path: '/categories/:id',
        name: 'category-detail',
        builder: (BuildContext context, GoRouterState state) {
          final id = state.pathParameters['id'] ?? '';
          return CategoryDetailPage(categoryId: id);
        },
      ),
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (BuildContext context, GoRouterState state) => const ProfilePage(),
      ),
      GoRoute(
        path: '/my-listings',
        name: 'my-listings',
        builder: (BuildContext context, GoRouterState state) => const MyListingsPage(),
      ),
      GoRoute(
        path: '/favorites',
        name: 'favorites',
        builder: (BuildContext context, GoRouterState state) => const FavoritesPage(),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (BuildContext context, GoRouterState state) =>
            const NotificationsInboxPage(),
      ),
      GoRoute(
        path: '/listings/create',
        name: 'listing-create',
        builder: (BuildContext context, GoRouterState state) =>
            const CreateListingWizardPage(),
      ),
      GoRoute(
        path: '/listings/:id/promote',
        name: 'listing-promote',
        builder: (BuildContext context, GoRouterState state) {
          final id = state.pathParameters['id'] ?? '';
          return PromoteListingPage(listingId: id);
        },
      ),
      GoRoute(
        path: '/listings/:id',
        name: 'listing-detail',
        builder: (BuildContext context, GoRouterState state) {
          final id = state.pathParameters['id'] ?? '';
          final mine = state.uri.queryParameters['mine'] == '1';
          return ListingDetailPage(listingId: id, mine: mine);
        },
      ),
      GoRoute(
        path: '/payments/:paymentId/result',
        name: 'payment-result',
        builder: (BuildContext context, GoRouterState state) {
          final paymentId = state.pathParameters['paymentId'] ?? '';
          final listingId = state.uri.queryParameters['listingId'] ?? '';
          final sandbox = state.uri.queryParameters['sandbox'] != '0';
          return PaymentResultPage(
            paymentId: paymentId,
            listingId: listingId,
            sandbox: sandbox,
          );
        },
      ),
    ],
  );
});
