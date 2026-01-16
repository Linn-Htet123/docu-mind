import { Module } from '@nestjs/common';
import { VectorService } from './vector.service';
import { LanceDbStore } from './stores/lancedb.store';

@Module({
  providers: [
    VectorService,
    LanceDbStore,
    {
      provide: 'VECTOR_STORE',
      useExisting: LanceDbStore,
    },
  ],
  exports: [VectorService],
})
export class VectorModule {}
