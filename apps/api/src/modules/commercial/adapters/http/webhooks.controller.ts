import { Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from '../../application/payments.service';

@ApiTags('webhooks')
@Controller('webhooks/payments')
export class PaymentWebhooksController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':providerCode')
  @ApiOperation({
    summary: 'Payment provider webhook (signature verified; idempotent on provider event id)',
  })
  handle(
    @Param('providerCode') providerCode: string,
    @Headers('x-tarweej-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : Buffer.isBuffer(req.rawBody)
          ? req.rawBody.toString('utf8')
          : JSON.stringify(req.body ?? {});
    return this.payments.processWebhook(providerCode, rawBody, signature);
  }
}
