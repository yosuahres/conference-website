import { Global, Module } from '@nestjs/common';

import { ConferenceController } from './conference.controller';
import { ConferenceService } from './conference.service';

@Global()
@Module({
  controllers: [ConferenceController],
  providers: [ConferenceService],
  exports: [ConferenceService],
})
export class ConferenceModule {}
