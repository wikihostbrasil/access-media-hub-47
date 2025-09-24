import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface DownloadWithDetails {
  id: string;
  user_id: string;
  file_id: string;
  downloaded_at: string;
  file_title?: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  user_name?: string;
}

export const useDownloads = () => {
  return useQuery({
    queryKey: ["downloads"],
    queryFn: async () => {
      return apiClient.getDownloads() as Promise<DownloadWithDetails[]>;
    },
  });
};