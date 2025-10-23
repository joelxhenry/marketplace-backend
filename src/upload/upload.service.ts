import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { UploadResponseDto, MultipleUploadResponseDto } from './dto/upload.dto';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  private readonly allowedDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  constructor(private readonly configService: ConfigService) {
    // Default to ./uploads directory
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    // Default max file size: 5MB
    this.maxFileSize =
      this.configService.get<number>('MAX_FILE_SIZE') || 5 * 1024 * 1024;

    // Ensure upload directories exist
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories() {
    const directories = [
      this.uploadDir,
      path.join(this.uploadDir, 'images'),
      path.join(this.uploadDir, 'avatars'),
      path.join(this.uploadDir, 'documents'),
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    return `${timestamp}-${uniqueId}${ext}`;
  }

  private validateFile(
    file: Express.Multer.File,
    allowedTypes: string[],
    maxSize?: number,
  ): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    const fileSizeLimit = maxSize || this.maxFileSize;
    if (file.size > fileSizeLimit) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${fileSizeLimit / 1024 / 1024}MB`,
      );
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadResponseDto> {
    this.validateFile(file, this.allowedImageTypes);

    const fileName = this.generateFileName(file.originalname);
    const filePath = path.join(this.uploadDir, 'images', fileName);

    try {
      fs.writeFileSync(filePath, file.buffer);

      return {
        url: `/uploads/images/${fileName}`,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to save file');
    }
  }

  async uploadImages(
    files: Express.Multer.File[],
  ): Promise<MultipleUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Validate all files first
    files.forEach(file => this.validateFile(file, this.allowedImageTypes));

    const uploadedFiles: UploadResponseDto[] = [];

    for (const file of files) {
      const fileName = this.generateFileName(file.originalname);
      const filePath = path.join(this.uploadDir, 'images', fileName);

      try {
        fs.writeFileSync(filePath, file.buffer);

        uploadedFiles.push({
          url: `/uploads/images/${fileName}`,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        });
      } catch (error) {
        // If any file fails, we continue with others but log the error
        console.error(`Failed to upload ${file.originalname}:`, error);
      }
    }

    if (uploadedFiles.length === 0) {
      throw new InternalServerErrorException('Failed to save any files');
    }

    return {
      files: uploadedFiles,
      count: uploadedFiles.length,
    };
  }

  async uploadAvatar(file: Express.Multer.File): Promise<UploadResponseDto> {
    this.validateFile(file, this.allowedImageTypes, 2 * 1024 * 1024); // 2MB limit for avatars

    const fileName = this.generateFileName(file.originalname);
    const filePath = path.join(this.uploadDir, 'avatars', fileName);

    try {
      fs.writeFileSync(filePath, file.buffer);

      return {
        url: `/uploads/avatars/${fileName}`,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to save avatar');
    }
  }

  async uploadDocument(file: Express.Multer.File): Promise<UploadResponseDto> {
    this.validateFile(
      file,
      this.allowedDocumentTypes,
      10 * 1024 * 1024, // 10MB limit for documents
    );

    const fileName = this.generateFileName(file.originalname);
    const filePath = path.join(this.uploadDir, 'documents', fileName);

    try {
      fs.writeFileSync(filePath, file.buffer);

      return {
        url: `/uploads/documents/${fileName}`,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to save document');
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extract the file path from URL (e.g., /uploads/images/file.jpg -> uploads/images/file.jpg)
      const filePath = fileUrl.startsWith('/')
        ? path.join('.', fileUrl)
        : fileUrl;

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }
}
