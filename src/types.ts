import * as uuid from 'uuid';

export type JsonApiError = {
  id: string;
  status: string;
  code: ErrorCode;
  title: string;
  detail: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
  meta?: any;
};

export type PackageVersion = {
  name: string;
  version: string;
  algo: string;
  status:
    | 'unknown'
    | 'pending'
    | 'verified'
    | 'unverified'
    | 'timeout'
    | 'error';
};

export function createError(code: ErrorCode, detail: string): JsonApiError {
  return {
    id: uuid.v4(),
    status: errorTypes[code].status,
    code,
    title: errorTypes[code].title,
    detail,
  };
}

export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

const errorTypes: {
  [code: string]: { status: string; title: string };
} = {
  [ErrorCode.NOT_FOUND]: {
    status: '404',
    title: 'Resource not found for the current user',
  },
  [ErrorCode.BAD_REQUEST]: {
    status: '400',
    title: 'The request was invalid',
  },
  [ErrorCode.INTERNAL_ERROR]: {
    status: '500',
    title: 'Internal service error',
  },
};
