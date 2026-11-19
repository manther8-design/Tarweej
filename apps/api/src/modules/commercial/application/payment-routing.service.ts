import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  PAYMENT_GATEWAY_REGISTRY,
  REGISTERED_PAYMENT_PROVIDERS,
  type PaymentGateway,
  type RegisteredPaymentProvider,
} from '../domain/commercial.types';

@Injectable()
export class PaymentRoutingService implements OnModuleInit {
  private readonly adapters = new Map<string, PaymentGateway>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY_REGISTRY) gateways: PaymentGateway[],
  ) {
    for (const gateway of gateways) {
      this.adapters.set(gateway.providerCode, gateway);
    }
  }

  onModuleInit(): void {
    for (const code of REGISTERED_PAYMENT_PROVIDERS) {
      if (!this.adapters.has(code)) {
        throw new Error(`Payment adapter not registered for provider_code=${code}`);
      }
    }
  }

  getAdapter(providerCode: string): PaymentGateway {
    const adapter = this.adapters.get(providerCode);
    if (!adapter) {
      throw new BadRequestException(`Unknown payment provider: ${providerCode}`);
    }
    return adapter;
  }

  assertRegisteredProvider(
    providerCode: string,
  ): asserts providerCode is RegisteredPaymentProvider {
    if (!REGISTERED_PAYMENT_PROVIDERS.includes(providerCode as RegisteredPaymentProvider)) {
      throw new BadRequestException(
        `Provider ${providerCode} is not deployed. Registered: ${REGISTERED_PAYMENT_PROVIDERS.join(', ')}`,
      );
    }
  }

  async resolveProviderCode(countryId: string): Promise<string> {
    const routes = await this.prisma.paymentProviderRoute.findMany({
      where: { countryId, isActive: true },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });

    for (const route of routes) {
      if (this.adapters.has(route.providerCode)) {
        return route.providerCode;
      }
    }

    // Safe fallback for local/dev when routes misconfigured but mock adapter exists.
    if (this.adapters.has('mock')) {
      return 'mock';
    }

    throw new ServiceUnavailableException(
      'No active payment provider route for this country. Configure payment_provider_routes.',
    );
  }

  async listRoutes() {
    return this.prisma.paymentProviderRoute.findMany({
      orderBy: [{ countryId: 'asc' }, { priority: 'asc' }],
      include: {
        country: { select: { id: true, iso2: true, iso3: true } },
      },
    });
  }

  async upsertRoute(input: {
    countryId: string;
    providerCode: string;
    priority: number;
    isActive: boolean;
  }) {
    this.assertRegisteredProvider(input.providerCode);
    const country = await this.prisma.country.findUnique({ where: { id: input.countryId } });
    if (!country) {
      throw new BadRequestException('Unknown countryId');
    }
    return this.prisma.paymentProviderRoute.upsert({
      where: {
        countryId_providerCode: {
          countryId: input.countryId,
          providerCode: input.providerCode,
        },
      },
      update: {
        priority: input.priority,
        isActive: input.isActive,
      },
      create: {
        countryId: input.countryId,
        providerCode: input.providerCode,
        priority: input.priority,
        isActive: input.isActive,
      },
      include: {
        country: { select: { id: true, iso2: true, iso3: true } },
      },
    });
  }
}
