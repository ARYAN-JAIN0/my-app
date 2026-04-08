// Local storage wrapper with type safety
type StorageValue = string | number | boolean | object | null;

class StorageService {
  private prefix: string;

  constructor(prefix: string = "rivo") {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  get<T extends StorageValue>(key: string): T | null {
    if (typeof window === "undefined") return null;
    
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;
      
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T extends StorageValue>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error("Storage error:", error);
    }
  }

  remove(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    if (typeof window === "undefined") return;
    
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Session storage for temporary data
  getSession<T extends StorageValue>(key: string): T | null {
    if (typeof window === "undefined") return null;
    
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      if (!item) return null;
      
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  setSession<T extends StorageValue>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error("Session storage error:", error);
    }
  }

  removeSession(key: string): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(this.getKey(key));
  }
}

export const storage = new StorageService();
export const session = new StorageService("rivo:session");

