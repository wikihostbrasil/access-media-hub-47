import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: "admin" | "operator" | "user";
  receive_notifications: boolean;
  whatsapp?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  email: string;
}

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log('🔍 Fetching users...');
      try {
        const result = await apiClient.getUsers();
        console.log('✅ Users fetched successfully:', result);
        return result as UserProfile[];
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: any }) => {
      return apiClient.updateUser(userId, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar usuário: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};