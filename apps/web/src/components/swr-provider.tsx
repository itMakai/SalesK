"use client"

import { SWRConfig } from "swr"
import { apiClient } from "@/lib/api-client"

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => {
          const path = url.startsWith('/api/v1') ? url.replace('/api/v1', '') : url;
          return apiClient.get(path).then(res => res.data);
        },
        revalidateOnFocus: false,
      }}
    >
      {children}
    </SWRConfig>
  )
}
