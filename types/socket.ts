export interface SocketException {
  status: "error";
  message?: string;
  statusCode?: number;
  error?: string;
  code?: string;
  cause?: { pattern: string; data: unknown };
}
