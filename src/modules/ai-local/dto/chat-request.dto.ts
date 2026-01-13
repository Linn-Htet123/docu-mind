import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({
    description: 'The prompt or question you want to ask the AI',
    example: 'Explain TypeScript interfaces in simple terms.',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Override the default model (optional)',
    example: 'llama3.2',
    required: false,
  })
  @IsOptional()
  @IsString()
  model?: string;
}
