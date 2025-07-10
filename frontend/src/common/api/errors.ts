export class StreamingError extends Error {
  statusText: string;
  status: number;
  detail?: string;

  constructor(message: string, statusText: string, status: number, detail?: string) {
    super(message);
    this.statusText = statusText;
    this.status = status;
    this.detail = detail;
    this.name = 'StreamingError';

    // Ensure the prototype chain is correctly set up for the error class
    Object.setPrototypeOf(this, StreamingError.prototype);
  }
}

export async function handleFetchResponse(response: Response): Promise<StreamingError> {
  let detail: string | undefined = undefined;

  if (response.body !== null) {
    // Check if the response body is not null and can be parsed as JSON
    try {
      const data = await response.json();

      if (data && data.detail) {
        detail = data.detail;
      }
    } catch (error) {
      // If parsing fails, detail remains undefined
    }
  }

  return new StreamingError(response.statusText, response.statusText, response.status, detail);
}
