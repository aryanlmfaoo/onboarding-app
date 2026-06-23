import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/auth.decorator';
import accessPayload from '../auth/types/accesstoken.type';
import { OrganizationService } from './organization.service.js';
import { createNewOrgDto } from './dto/createneworg.dto';
import { addEmployeeTokenDto } from './dto/addemployeetoken.dto';
import { addEmployeeToOrganizationDto } from './dto/addemployeetoorg.dto';
import { createNewProjectDto } from './dto/createnewproject.dto';
import { addEmployeeToProjectDto } from './dto/addemployeetoproject.dto';

@Controller('org')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * @param user
   * @param createNewOrgDto
   * Method: POST
   * Path: /org/
   */
  @UseGuards(JwtAuthGuard)
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async createNewOrganization(
    @GetUser() user: accessPayload,
    @Body() createNewOrgDto: createNewOrgDto,
  ) {
    return this.organizationService.createNewOrganization(
      user,
      createNewOrgDto,
    );
  }

  /**
   *
   * @param addEmployeeTokenDto
   * @param user
   * Method: POST
   * Path: /org/employee/create
   */
  @UseGuards(JwtAuthGuard)
  @Post('employee/create')
  @HttpCode(HttpStatus.CREATED)
  async addEmployeeToken(
    @Body() addEmployeeTokenDto: addEmployeeTokenDto,
    @GetUser() user: accessPayload,
  ) {
    return await this.organizationService.addEmployeeEntryToken(
      addEmployeeTokenDto,
      user,
    );
  }

  /**
   * @param addEmployeeToOrganizationDto
   * @param user
   * Method: POST
   * Path: /org/employee/add
   */
  @UseGuards(JwtAuthGuard)
  @Post('employee/add')
  @HttpCode(HttpStatus.CREATED)
  async addEmployeeToOrganization(
    @Body() addEmployeeToOrganizationDto: addEmployeeToOrganizationDto,
    @GetUser() user: accessPayload,
  ) {
    return await this.organizationService.addEmployeeToOrganization(
      addEmployeeToOrganizationDto,
      user,
    );
  }

  /**
   * @param createNewProjectDto
   * @param user
   * Method: POST
   * Path: /org/project
   */
  @UseGuards(JwtAuthGuard)
  @Post('project')
  @HttpCode(HttpStatus.CREATED)
  async createNewProject(
    @Body() createNewProjectDto: createNewProjectDto,
    @GetUser() user: accessPayload,
  ) {
    return await this.organizationService.createNewProject(
      createNewProjectDto,
      user,
    );
  }

  /**
   * @param addEmployeeToProjectDto
   * @param user
   * Method: POST
   * Path: /org/project/member
   */
  @UseGuards(JwtAuthGuard)
  @Post('project/member')
  @HttpCode(HttpStatus.OK)
  async addEmployeeToProject(
    @Body() addEmployeeToProjectDto: addEmployeeToProjectDto,
    @GetUser() user: accessPayload,
  ) {
    return await this.organizationService.addEmployeeToProject(
      addEmployeeToProjectDto,
      user,
    );
  }
}
