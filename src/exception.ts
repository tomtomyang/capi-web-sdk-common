export class CapiUnexpectedException extends Error {
  public action: string;
  constructor(action: string, message: string) {
    super(message || 'UnknownException');
    this.action = action;
    this.name = this.constructor.name;
  }
}

export class CapiHttpStatusException extends Error {
  public action: string;
  public httpStatus?: string | number;
  public httpStatusText?: string;

  constructor(action: string, httpStatus: string | number, httpStatusText?: string) {
    super(httpStatusText || 'UnknownException');
    this.action = action;
    this.httpStatus = httpStatus;
    this.httpStatusText = httpStatusText;
    this.name = this.constructor.name;
  }
}

export class CapiInsigntException extends Error {
  public action: string;
  public requestId: string;
  public errorCode?: string | number;
  public errorMessage?: string;

  constructor(action: string, requestId: string, code?: string | number, message?: string) {
    super(message || 'UnknownException');
    this.action = action;
    this.requestId = requestId;
    this.errorCode = code;
    this.errorMessage = message;
    this.name = this.constructor.name;
  }
}
