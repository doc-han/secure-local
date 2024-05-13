export type SecureThis = {
  section: string;
  get: (keys: string | string[] | null) => Promise<Record<string, any>>;
  set: (items: { [key: string]: any }) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
  clear: () => Promise<void>;
  __getBaseDirectory: () => Promise<FileSystemDirectoryHandle>;
};

declare global {
  interface Window {
    SecureLocal: any;
  }
}
