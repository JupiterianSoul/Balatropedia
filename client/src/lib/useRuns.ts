import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

export interface RunMeta {
  deckId?: string | null;
  stakeId?: string | null;
  voucherIds?: string[];
}

export interface SavedRun {
  id: number;
  userId: number;
  name: string;
  jokerIds: string[];
  notes: string | null;
  meta: RunMeta | null;
  createdAt: number;
}

export function useRuns() {
  const { isSignedIn } = useAuth();

  const { data: runs = [], isLoading } = useQuery<SavedRun[]>({
    queryKey: ["/api/runs"],
    enabled: isSignedIn,
  });

  const saveRun = useMutation({
    mutationFn: async (input: { name: string; jokerIds: string[]; notes?: string | null; meta?: RunMeta | null }) => {
      const res = await apiRequest("POST", "/api/runs", input);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/runs"] }),
  });

  const deleteRun = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/runs/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/runs"] }),
  });

  return { runs, isLoading, saveRun, deleteRun };
}
