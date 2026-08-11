import { Module } from '@nestjs/common';

import { MidtransService } from './midtrans.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [MidtransService, PaymentsService],
  exports: [PaymentsService, MidtransService],
})
export class PaymentsModule {}
