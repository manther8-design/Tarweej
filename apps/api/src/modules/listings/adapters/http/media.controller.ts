import { Controller, Get, NotFoundException, Param, Res, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';

/**
 * Local media stub proxy for OBJECT_STORAGE_DRIVER=local.
 * Serves files from the local object-storage root; CDN can replace this later.
 * Keys are shaped as listings/{listingId}/{filename}.
 *
 * When a seed/dev object is missing on disk, serves a tiny PNG placeholder so
 * Flutter Image.network still resolves instead of 404.
 */
@ApiTags('media')
@Controller('media')
export class MediaController {
  private readonly root: string;

  /** 48×36 teal PNG placeholder (dev/seed fallback). */
  private static readonly PLACEHOLDER_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAIAAABAJy5dAAAAM0lEQVR42u3OAQkAAAgDsBewtwEMbA2FwQIsNX1KhISEhISEhISEhISEhISEhISEhD6FFpFM1Sq93xRAAAAAAElFTkSuQmCC',
    'base64',
  );

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
      // Seed metadata-only rows still get a loadable image in local/dev.
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('X-Tarweej-Media', 'placeholder');
      return new StreamableFile(Readable.from(MediaController.PLACEHOLDER_PNG));
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
