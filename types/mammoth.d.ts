declare module "mammoth" {
  interface ConvertResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface ConvertOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export function convertToHtml(options: ConvertOptions): Promise<ConvertResult>;
  export function convertToMarkdown(options: ConvertOptions): Promise<ConvertResult>;
  export function extractRawText(options: ConvertOptions): Promise<ConvertResult>;
}
