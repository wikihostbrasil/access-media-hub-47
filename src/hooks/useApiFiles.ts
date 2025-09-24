import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const useFiles = () => {
  return useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      return apiClient.getFiles();
    },
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return apiClient.uploadFile(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao enviar arquivo: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.deleteFile(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({
        title: "Sucesso",
        description: "Arquivo deletado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao deletar arquivo: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};