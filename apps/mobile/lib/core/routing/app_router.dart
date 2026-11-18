import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/home/presentation/home_page.dart';
import 'package:tarweej_mobile/features/splash/presentation/splash_page.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/splash',
  routes: <RouteBase>[
    GoRoute(
      path: '/splash',
      name: 'splash',
      builder: (BuildContext context, GoRouterState state) => const SplashPage(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (BuildContext context, GoRouterState state) => const HomePage(),
    ),
  ],
);
