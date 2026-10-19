import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { CatalogueOrder } from './entities/catalogue-order.entity';

export interface OrderReceiptFile {
  filename: string;
  mimeType: 'application/pdf';
  contentBase64: string;
}

/** Order reference customers and staff both see: the id's first eight characters. */
export function orderReference(orderId: string): string {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
}

/**
 * Plain amount for the PDF. The built-in Helvetica cannot draw the naira sign,
 * so the currency is spelled out rather than rendered as a missing glyph.
 */
export function receiptAmount(
  value: number | string | null | undefined,
): string {
  const amount = Number(value) || 0;
  return `NGN ${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

@Injectable()
export class CatalogueOrderReceiptService {
  constructor(
    @InjectRepository(CatalogueOrder)
    private readonly orderRepository: Repository<CatalogueOrder>,
  ) {}

  /** The customer's own order as a PDF receipt; anyone else's order is a 404. */
  async buildForCustomer(
    customerId: string,
    orderId: string,
  ): Promise<OrderReceiptFile> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, customerId },
      relations: [
        'items',
        'items.item',
        'items.offer',
        'branch',
        'branch.business',
      ],
    });
    if (!order) throw new NotFoundException('Order not found');

    const buffer = await this.render(order);
    return {
      filename: `vemtap-receipt-${order.id.slice(0, 8)}.pdf`,
      mimeType: 'application/pdf',
      contentBase64: buffer.toString('base64'),
    };
  }

  private render(order: CatalogueOrder): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 36 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const business = order.branch?.business?.name ?? 'VemTap business';
      const branch = [order.branch?.name, order.branch?.address]
        .filter(Boolean)
        .join(' · ');
      // `createdAt` is a `timestamp without time zone` holding UTC, which the
      // driver reads as server-local time; undo that before formatting.
      const raw = new Date(order.createdAt);
      const placed = new Date(raw.getTime() - raw.getTimezoneOffset() * 60_000);

      doc.font('Helvetica-Bold').fontSize(16).text(business);
      if (branch)
        doc.font('Helvetica').fontSize(9).fillColor('#555555').text(branch);
      doc.fillColor('#000000').moveDown(0.8);

      doc.font('Helvetica-Bold').fontSize(12).text('Order receipt');
      doc.font('Helvetica').fontSize(9);
      doc.text(`Order ${orderReference(order.id)}`);
      doc.text(
        `Placed ${placed.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' })}`,
      );
      doc.text(`Status: ${String(order.status).replace(/_/g, ' ')}`);
      if (order.tableNumber) doc.text(`Table ${order.tableNumber}`);
      doc.moveDown(0.8);

      const left = doc.page.margins.left;
      const width = doc.page.width - left - doc.page.margins.right;
      const amountX = left + width - 110;
      doc.font('Helvetica-Bold').fontSize(9);
      const headerY = doc.y;
      doc.text('Item', left, headerY, { width: amountX - left - 8 });
      doc.text('Amount', amountX, headerY, { width: 110, align: 'right' });
      doc.moveDown(0.4).font('Helvetica');

      for (const line of order.items ?? []) {
        const name = line.item?.name ?? line.offer?.name ?? 'Item';
        const unit = Number(line.priceAtOrder) || 0;
        const y = doc.y;
        doc.text(
          `${name} x${line.quantity} @ ${receiptAmount(unit)}`,
          left,
          y,
          {
            width: amountX - left - 8,
          },
        );
        const after = doc.y;
        doc.text(receiptAmount(unit * line.quantity), amountX, y, {
          width: 110,
          align: 'right',
        });
        doc.y = Math.max(after, doc.y);
        doc.moveDown(0.2);
      }

      doc.moveDown(0.6).font('Helvetica-Bold').fontSize(11);
      const totalY = doc.y;
      doc.text('Total', left, totalY);
      doc.text(receiptAmount(order.totalAmount), amountX, totalY, {
        width: 110,
        align: 'right',
      });
      if (order.notes) {
        doc
          .moveDown(0.8)
          .font('Helvetica')
          .fontSize(9)
          .text(`Note: ${order.notes}`, left);
      }
      doc
        .moveDown(1.2)
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#777777')
        .text(
          'Paid to the business directly. VemTap does not collect payment for orders.',
          left,
        );
      doc.end();
    });
  }
}
