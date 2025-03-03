/// <reference types="https://deno.land/x/types/index.d.ts" />

declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export interface ServeInit {
    port?: number;
    hostname?: string;
    handler: (request: Request) => Response | Promise<Response>;
    onError?: (error: unknown) => Response | Promise<Response>;
  }

  export type Handler = (
    request: Request,
    connInfo: ConnInfo,
  ) => Response | Promise<Response>;

  export interface ConnInfo {
    readonly localAddr: Deno.Addr;
    readonly remoteAddr: Deno.Addr;
  }

  export function serve(
    handler: Handler,
    init?: number | ServeInit
  ): Promise<void>;
}

// Add other module declarations as needed