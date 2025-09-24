import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface StatsData {
  total_files: number;
  total_downloads: number;
  downloads_today: number;
  unique_users_month: number;
  active_users: number;
  recent_downloads: Array<{
    date: string;
    count: number;
  }>;
}

export const useStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      return apiClient.getStats() as Promise<StatsData>;
    },
  });
};