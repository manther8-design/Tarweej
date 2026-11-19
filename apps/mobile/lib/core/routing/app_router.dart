import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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
import 'package:tarweej_mobile/features/profile/presentation/profile_page.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/features/reference/presentation/country_select_page.dart';
import 'package:tarweej_mobile/features/search/presentation/search_page.dart';
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

      // First-run gate: require a persisted country before auth/home surfaces.
      if (!reference.hasCountry && loc != '/country' && loc != '/splash') {
        return '/country';
      }

      if (!auth.isAuthenticated) {
        final needsAuth = loc == '/profile' ||
            loc == '/home' ||
            loc == '/my-listings' ||
            loc == '/favorites' ||
            loc == '/chat' ||
            loc.startsWith('/chat/') ||
            loc == '/listings/create' ||
            (loc.startsWith('/listings/') && state.uri.queryParameters['mine'] == '1');
        if (needsAuth) {
          return '/login';
        }
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
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (BuildContext context, GoRouterState state) => const HomePage(),
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
        path: '/chat',
        name: 'chat',
        builder: (BuildContext context, GoRouterState state) => const ChatListPage(),
      ),
      GoRoute(
        path: '/chat/:id',
        name: 'chat-thread',
        builder: (BuildContext context, GoRouterState state) {
          final id = state.pathParameters['id'] ?? '';
          return ChatThreadPage(conversationId: id);
        },
      ),
      GoRoute(
        path: '/listings/create',
        name: 'listing-create',
        builder: (BuildContext context, GoRouterState state) =>
            const CreateListingWizardPage(),
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
    ],
  );
});
