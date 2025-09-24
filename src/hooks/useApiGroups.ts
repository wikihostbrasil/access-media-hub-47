import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  user_count: number;
  created_by_name?: string;
}

export const useGroups = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      return apiClient.getGroups() as Promise<Group[]>;
    },
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      return apiClient.createGroup(name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar grupo: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.deleteGroup(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Sucesso",
        description: "Grupo deletado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao deletar grupo: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, groupData }: { groupId: string; groupData: any }) => {
      return apiClient.updateGroup(groupId, groupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Sucesso",
        description: "Grupo atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar grupo: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useGroupMembers = (groupId: string | null) => {
  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      return apiClient.getGroupMembers(groupId);
    },
    enabled: !!groupId,
  });
};

export const useUpdateGroupMembers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, userIds, action }: { groupId: string; userIds: string[]; action?: string }) => {
      return apiClient.updateGroupMembers(groupId, userIds, action);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Sucesso",
        description: "Membros do grupo atualizados com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar membros: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};