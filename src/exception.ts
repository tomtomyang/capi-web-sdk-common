export class CapiSDKException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  getMessage(): string {
    return `[${this.name}] message: ${this.message}`;
  }

  toString(): string {
    return this.getMessage();
  }

  toLocaleString(): string {
    return this.getMessage();
  }
}

export class HttpStatusException extends Error {
  public httpStatus?: string | number;
  public httpStatusText?: string;

  constructor(httpStatus: string | number, httpStatusText?: string) {
    super(httpStatusText);
    this.httpStatus = httpStatus;
    this.httpStatusText = httpStatusText;
    this.name = this.constructor.name;
  }

  getMessage(): string {
    return `[${this.name}] httpStatus: ${this.httpStatus} httpStatusText: ${this.httpStatusText}`;
  }

  toString(): string {
    return this.getMessage();
  }

  toLocaleString(): string {
    return this.getMessage();
  }
}

export class CapiInsigntException extends Error {
  /**
   * capi action
   */
  public action: string;
  /**
   * capi RequestId
   */
  public requestId: string;
  /**
   * capi Code
   */
  public errorCode?: string | number;
  /**
   * capi Message
   */
  public errorMessage?: string;

  constructor(action: string, requestId: string, code?: string | number, message?: string) {
    super(message);
    this.action = action;
    this.requestId = requestId;
    this.errorCode = code;
    this.errorMessage = message;
    this.name = this.constructor.name;
  }

  getMessage(): string {
    return `[${this.name}] Action: ${this.action} RequestId: ${this.requestId} ErrorCode: ${this.errorCode} ErrorMessage: ${this.errorMessage}`;
  }

  toString(): string {
    return this.getMessage();
  }

  toLocaleString(): string {
    return this.getMessage();
  }
}
