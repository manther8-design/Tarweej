import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/auth/presentation/login_page.dart';
import 'package:tarweej_mobile/features/auth/presentation/otp_page.dart';
import 'package:tarweej_mobile/features/auth/presentation/register_page.dart';
import 'package:tarweej_mobile/features/home/presentation/home_page.dart';
import 'package:tarweej_mobile/features/profile/presentation/profile_page.dart';
import 'package:tarweej_mobile/features/splash/presentation/splash_page.dart';

final _routerRefreshProvider = Provider<_RouterRefresh>((ref) {
  final refresh = _RouterRefresh();
  ref.listen<AuthState>(authControllerProvider, (_, __) => refresh.notify());
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
      final loc = state.matchedLocation;
      final isAuthRoute =
          loc == '/login' || loc == '/register' || loc == '/otp' || loc == '/splash';

      if (!auth.bootstrapped) {
        return loc == '/splash' ? null : '/splash';
      }

      if (!auth.isAuthenticated && (loc == '/profile' || loc == '/home')) {
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
        path: '/profile',
        name: 'profile',
        builder: (BuildContext context, GoRouterState state) => const ProfilePage(),
      ),
    ],
  );
});
