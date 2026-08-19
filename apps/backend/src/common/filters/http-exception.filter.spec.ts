import { HttpStatus, HttpException, BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';
import { QueryFailedError } from 'typeorm';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
    };
    mockRequest = {
      url: '/api/v1/test',
      method: 'GET',
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('should handle standard HttpException with original status', () => {
    const error = new BadRequestException('Validation failed');
    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/api/v1/test',
        method: 'GET',
      }),
    );
  });

  it('should translate PostgreSQL 22P02 (invalid UUID/syntax) to 400 Bad Request', () => {
    const queryError = new QueryFailedError(
      'SELECT * FROM table WHERE id = $1',
      [''],
      {
        name: 'error',
        code: '22P02',
        message: 'invalid input syntax for type uuid: ""',
      } as any,
    );

    filter.catch(queryError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid format or data type for identifier or parameter',
      }),
    );
  });

  it('should translate PostgreSQL 23505 (unique violation) to 409 Conflict', () => {
    const queryError = new QueryFailedError(
      'INSERT INTO table',
      [],
      {
        name: 'error',
        code: '23505',
        detail: 'Key (email)=(test@example.com) already exists.',
      } as any,
    );

    filter.catch(queryError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'Key (email)=(test@example.com) already exists.',
      }),
    );
  });

  it('should translate PostgreSQL 23503 (foreign key violation) to 400 Bad Request', () => {
    const queryError = new QueryFailedError(
      'INSERT INTO table',
      [],
      {
        name: 'error',
        code: '23503',
        detail: 'Key (business_id)=(non-existent) is not present in table "businesses".',
      } as any,
    );

    filter.catch(queryError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Key (business_id)=(non-existent) is not present in table "businesses".',
      }),
    );
  });

  it('should fall back to 500 for generic unhandled exceptions', () => {
    const error = new Error('Unexpected crash');
    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });
});
