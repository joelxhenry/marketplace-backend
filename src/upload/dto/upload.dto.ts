import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Uploaded file URL',
    example: '/uploads/images/1730000000000-abc123.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'profile-photo.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 245678,
  })
  size: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  mimetype: string;
}

export class MultipleUploadResponseDto {
  @ApiProperty({
    description: 'Array of uploaded file information',
    type: [UploadResponseDto],
  })
  files: UploadResponseDto[];

  @ApiProperty({
    description: 'Total number of files uploaded',
    example: 3,
  })
  count: number;
}
