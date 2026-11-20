import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/features/catalog/domain/catalog_models.dart';
import 'package:tarweej_mobile/features/listings/application/listings_controller.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/listing_card.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

class CreateListingWizardPage extends ConsumerStatefulWidget {
  const CreateListingWizardPage({super.key});

  @override
  ConsumerState<CreateListingWizardPage> createState() => _CreateListingWizardPageState();
}

class _CreateListingWizardPageState extends ConsumerState<CreateListingWizardPage> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController(text: '100');
  int _step = 0;
  String? _categoryId;
  CatalogCategoryDetail? _categoryDetail;
  final Map<String, String> _attrText = {};
  final Map<String, String> _attrNumber = {};
  final Map<String, bool> _attrBool = {};
  bool _mediaStubReady = false;
  bool _submitting = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _price.dispose();
    super.dispose();
  }

  List<CatalogCategory> _flatten(List<CatalogCategory> roots) {
    final out = <CatalogCategory>[];
    void walk(CatalogCategory node) {
      out.add(node);
      for (final child in node.children) {
        walk(child);
      }
    }

    for (final root in roots) {
      walk(root);
    }
    return out;
  }

  Future<void> _selectCategory(String id) async {
    setState(() => _categoryId = id);
    await ref.read(catalogControllerProvider.notifier).selectCategory(id);
    setState(() => _categoryDetail = ref.read(catalogControllerProvider).selected);
  }

  List<Map<String, dynamic>> _buildAttributes() {
    final detail = _categoryDetail;
    if (detail == null) {
      return const <Map<String, dynamic>>[];
    }
    final attrs = <Map<String, dynamic>>[];
    for (final attr in detail.attributes) {
      switch (attr.dataType) {
        case 'bool':
          attrs.add(<String, dynamic>{
            'attributeDefinitionId': attr.attributeDefinitionId,
            'valueBool': _attrBool[attr.attributeDefinitionId] ?? false,
          });
        case 'int':
        case 'number':
        case 'decimal':
          final raw = _attrNumber[attr.attributeDefinitionId];
          if (raw == null || raw.isEmpty) {
            continue;
          }
          attrs.add(<String, dynamic>{
            'attributeDefinitionId': attr.attributeDefinitionId,
            'valueNumber': num.parse(raw),
          });
        default:
          final text = _attrText[attr.attributeDefinitionId];
          if (text == null || text.isEmpty) {
            continue;
          }
          attrs.add(<String, dynamic>{
            'attributeDefinitionId': attr.attributeDefinitionId,
            'valueText': text,
          });
      }
    }
    return attrs;
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);
    final auth = ref.read(authControllerProvider);
    final reference = ref.read(referenceControllerProvider);
    if (!auth.isAuthenticated) {
      context.goNamed('login');
      return;
    }
    final countryId = reference.selectedCountryId;
    if (_categoryId == null || countryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.listingWizardMissing)));
      return;
    }
    if (!_mediaStubReady) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.listingMediaStubHint)));
      return;
    }

    setState(() => _submitting = true);
    final created = await ref.read(listingsControllerProvider.notifier).createAndSubmit(
          categoryId: _categoryId!,
          countryId: countryId,
          title: _title.text.trim(),
          description: _description.text.trim(),
          priceAmount: double.tryParse(_price.text.trim()) ?? 0,
          currencyCode: 'SAR',
          attributes: _buildAttributes(),
        );
    setState(() => _submitting = false);

    if (!mounted) {
      return;
    }
    if (created == null) {
      final error = ref.read(listingsControllerProvider).error ?? l10n.listingWizardFailed;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error)));
      return;
    }

    final promote = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.listingWizardFeaturedUpsellTitle),
        content: Text(l10n.listingWizardFeaturedUpsellBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(l10n.listingWizardFeaturedUpsellSkip),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(l10n.listingWizardFeaturedUpsellAction),
          ),
        ],
      ),
    );

    if (!mounted) {
      return;
    }
    if (promote == true) {
      context.goNamed(
        'listing-promote',
        pathParameters: <String, String>{'id': created.id},
      );
      return;
    }
    context.goNamed(
      'listing-detail',
      pathParameters: <String, String>{'id': created.id},
      queryParameters: <String, String>{'mine': '1'},
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final catalog = ref.watch(catalogControllerProvider);
    final reference = ref.watch(referenceControllerProvider);
    final leaves = _flatten(catalog.roots);
    final priceAmount = double.tryParse(_price.text.trim());

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: Text(l10n.createListingTitle)),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('${l10n.listingWizardStep} ${_step + 1}/4'),
              const SizedBox(height: 12),
              Expanded(
                child: switch (_step) {
                  0 => ListView(
                      children: [
                        Text(l10n.listingWizardCategoryStep),
                        const SizedBox(height: 12),
                        ...leaves.map(
                          (c) => RadioListTile<String>(
                            value: c.id,
                            groupValue: _categoryId,
                            title: Text(c.name),
                            subtitle: Text(c.slug),
                            onChanged: (value) {
                              if (value != null) {
                                _selectCategory(value);
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                  1 => ListView(
                      children: [
                        Text(l10n.listingWizardFieldsStep),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _title,
                          decoration: InputDecoration(labelText: l10n.listingTitleLabel),
                        ),
                        TextField(
                          controller: _description,
                          decoration:
                              InputDecoration(labelText: l10n.listingDescriptionLabel),
                          maxLines: 4,
                        ),
                        TextField(
                          controller: _price,
                          decoration: InputDecoration(labelText: l10n.listingPriceLabel),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        if (_categoryDetail == null)
                          Text(l10n.listingWizardPickCategoryFirst)
                        else
                          ..._categoryDetail!.attributes.map((attr) {
                            if (attr.dataType == 'bool') {
                              return SwitchListTile(
                                title: Text(attr.name),
                                value: _attrBool[attr.attributeDefinitionId] ?? false,
                                onChanged: (v) => setState(
                                  () => _attrBool[attr.attributeDefinitionId] = v,
                                ),
                              );
                            }
                            if (attr.dataType == 'single_select') {
                              return DropdownButtonFormField<String>(
                                // ignore: deprecated_member_use
                                value: _attrText[attr.attributeDefinitionId],
                                decoration: InputDecoration(labelText: attr.name),
                                items: attr.options
                                    .map(
                                      (o) => DropdownMenuItem(
                                        value: o.value,
                                        child: Text(o.label),
                                      ),
                                    )
                                    .toList(growable: false),
                                onChanged: (v) {
                                  if (v != null) {
                                    setState(
                                      () => _attrText[attr.attributeDefinitionId] = v,
                                    );
                                  }
                                },
                              );
                            }
                            if (attr.dataType == 'int' ||
                                attr.dataType == 'number' ||
                                attr.dataType == 'decimal') {
                              return TextField(
                                decoration: InputDecoration(
                                  labelText: attr.unit == null
                                      ? attr.name
                                      : '${attr.name} (${attr.unit})',
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (v) => setState(
                                  () => _attrNumber[attr.attributeDefinitionId] = v,
                                ),
                              );
                            }
                            return TextField(
                              decoration: InputDecoration(labelText: attr.name),
                              onChanged: (v) => setState(
                                () => _attrText[attr.attributeDefinitionId] = v,
                              ),
                            );
                          }),
                      ],
                    ),
                  2 => ListView(
                      children: [
                        Text(l10n.listingWizardMediaStep),
                        const SizedBox(height: 12),
                        Text(l10n.listingMediaStubHint),
                        const SizedBox(height: 16),
                        FilledButton.tonal(
                          onPressed: () => setState(() => _mediaStubReady = true),
                          child: Text(
                            _mediaStubReady
                                ? l10n.listingMediaStubReady
                                : l10n.listingMediaStubAction,
                          ),
                        ),
                      ],
                    ),
                  _ => ListView(
                      children: [
                        Text(l10n.listingWizardPreviewHeading),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 260,
                          child: ListingCard(
                            data: ListingCardData(
                              id: 'preview',
                              title: _title.text.trim().isEmpty
                                  ? l10n.listingTitleLabel
                                  : _title.text.trim(),
                              priceAmount: priceAmount,
                              currencyCode: 'SAR',
                              locationLabel: reference.selectedCountryName,
                              isFeatured: false,
                              subtitle: _categoryDetail?.name,
                            ),
                            onTap: () {},
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _description.text.trim().isEmpty
                              ? l10n.listingDescriptionLabel
                              : _description.text.trim(),
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: TarweejColors.featuredSoft.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: TarweejColors.featured.withValues(alpha: 0.35),
                            ),
                          ),
                          child: Text(
                            l10n.listingWizardFeaturedUpsellBody,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: TarweejColors.charcoal,
                                ),
                          ),
                        ),
                      ],
                    ),
                },
              ),
              Row(
                children: [
                  if (_step > 0)
                    TextButton(
                      onPressed: _submitting ? null : () => setState(() => _step -= 1),
                      child: Text(l10n.listingWizardBack),
                    ),
                  const Spacer(),
                  if (_step < 3)
                    FilledButton(
                      onPressed: () {
                        if (_step == 0 && _categoryId == null) {
                          return;
                        }
                        setState(() => _step += 1);
                      },
                      child: Text(l10n.listingWizardNext),
                    )
                  else
                    FilledButton(
                      onPressed: _submitting ? null : _submit,
                      child: Text(l10n.listingWizardSubmit),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
