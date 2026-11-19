import { Controller, Get, NotFoundException, Param, Res, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Local media stub proxy for OBJECT_STORAGE_DRIVER=local.
 * Serves files from the local object-storage root; CDN can replace this later.
 * Keys are shaped as listings/{listingId}/{filename}.
 */
@ApiTags('media')
@Controller('media')
export class MediaController {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = config.get<string>('storage.localRoot') ?? '.data/object-storage';
  }

  @Get('listings/:listingId/:filename')
  @ApiOperation({ summary: 'Serve local listing media stub (dev CDN placeholder)' })
  serve(
    @Param('listingId') listingId: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!listingId || !filename || listingId.includes('..') || filename.includes('..')) {
      throw new NotFoundException('Invalid media path');
    }
    const key = `listings/${listingId}/${filename}`;
    const abs = join(this.root, key);
    if (!existsSync(abs)) {
      throw new NotFoundException('Media not found');
    }
    const ext = filename.split('.').pop()?.toLowerCase();
    const mime =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : ext === 'gif'
            ? 'image/gif'
            : 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return new StreamableFile(createReadStream(abs));
  }
}
