import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { ObjectstoreService } from './objectstore/objectstore.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [DocumentService, ObjectstoreService],
  controllers: [DocumentController],
})
export class DocumentModule {}
