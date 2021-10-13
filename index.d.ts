export const createAPI: ({ baseURL }: {baseURL: string;}) => {
  setHeaders(headers: any): void;
  get(endpoint: string, query?: {}): Promise<any[]>;
  post(endpoint: string, body: any, query?: {}): Promise<any[]>;
  put(endpoint: string, body: any, query?: {}): Promise<any[]>;
  patch(endpoint: string, body: any, query?: {}): Promise<any[]>;
  delete(endpoint: string): Promise<any[]>;
}