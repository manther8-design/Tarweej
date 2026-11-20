import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class CountrySelectPage extends ConsumerStatefulWidget {
  const CountrySelectPage({super.key});

  @override
  ConsumerState<CountrySelectPage> createState() => _CountrySelectPageState();
}

class _CountrySelectPageState extends ConsumerState<CountrySelectPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final locale = Localizations.localeOf(context).languageCode;
      ref.read(referenceControllerProvider.notifier).loadCountries(lang: locale);
    });
  }

  Future<void> _onSelect(String countryId) async {
    final state = ref.read(referenceControllerProvider);
    final match = state.countries.where((c) => c.id == countryId).toList();
    if (match.isEmpty) {
      return;
    }
    await ref.read(referenceControllerProvider.notifier).selectCountry(match.first);
    if (!mounted) {
      return;
    }
    context.goNamed('home');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(referenceControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.countrySelectTitle)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.countrySelectSubtitle,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            if (state.error != null) ...[
              Text(
                state.error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () {
                  final locale = Localizations.localeOf(context).languageCode;
                  ref
                      .read(referenceControllerProvider.notifier)
                      .loadCountries(lang: locale);
                },
                child: Text(l10n.countrySelectRetry),
              ),
              const SizedBox(height: 12),
            ],
            Expanded(
              child: state.loading && state.countries.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.separated(
                      itemCount: state.countries.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final country = state.countries[index];
                        final selected = country.id == state.selectedCountryId;
                        return ListTile(
                          title: Text(country.name),
                          subtitle: Text(
                            '${country.iso2} · ${country.dialingCode}'
                            '${country.primaryCurrencyCode != null ? ' · ${country.primaryCurrencyCode}' : ''}',
                          ),
                          trailing: selected
                              ? Icon(
                                  Icons.check_circle,
                                  color: Theme.of(context).colorScheme.primary,
                                )
                              : const Icon(Icons.chevron_right),
                          onTap: () => _onSelect(country.id),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
