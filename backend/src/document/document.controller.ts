import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { DocumentService } from './document.service';
import { UploadDocumentDto } from './dto/uploaddocument.dto';
import { User } from '../../generated/prisma/client';
import { GetUser } from '../auth/auth.decorator';
import { VerifyDocumentUploadDto } from './dto/verifydocumentupload.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   *
   * @param uploadDocumentDto
   * @param user
   * Method: POST
   * Path: /document
   */
  @UseGuards(JwtAuthGuard)
  @Post('')
  @HttpCode(HttpStatus.OK)
  async uploadDocument(
    @Body() uploadDocumentDto: UploadDocumentDto,
    @GetUser() user: User,
  ) {
    return await this.documentService.uploadDocumentMetaData(
      uploadDocumentDto,
      user,
    );
  }

  /**
   * @param verifyDocumentUploadDto
   * Method: PUT
   * Path: /document/verify
   */
  @UseGuards(JwtAuthGuard)
  @Put('verify')
  @HttpCode(HttpStatus.OK)
  async verifyDocumentUpload(
    @Body() verifyDocumentUploadDto: VerifyDocumentUploadDto,
  ) {
    return this.documentService.verifyUpload(verifyDocumentUploadDto);
  }
}
