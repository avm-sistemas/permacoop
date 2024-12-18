import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @Min(1)
  @Max(10000)
  @IsNumber()
  @Transform((_, { page }) => +page)
  public page = 1;
}
