import {
  messageCreationBodyType,
  updateMessageBodyType,
} from "@shared/types/apiTypes";
import { SwitchStatusDto } from "@shared/types/userTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/apiClient";

export interface DeliveryEventItem {
  id: number;
  messageId: number;
  channel: "EMAIL" | "WHATSAPP" | "BOTH";
  recipient: string;
  success: boolean;
  error?: string | null;
  createdAt: string;
}

export interface MessageItem {
  id: number;
  title: string | null;
  content: string;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  deliveryChannel: "EMAIL" | "WHATSAPP" | "BOTH";
  status: "PENDING" | "SENT" | "FAILED";
  triggerAfterDays: number | null;
  daysRemaining?: number;
  sentAt?: string | null;
  failedAttempts?: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt?: string;
  deliveryEvents?: DeliveryEventItem[];
}

export const messageKeys = {
  all: ["messages"] as const,
  lists: () => [...messageKeys.all, "list"] as const,
  list: (page = 1, limit = 50) => [...messageKeys.lists(), { page, limit }] as const,
  details: () => [...messageKeys.all, "detail"] as const,
  detail: (id: number) => [...messageKeys.details(), id] as const,
};

export const switchStatusKeys = {
  all: ["switch-status"] as const,
};

export const useSwitchStatus = () => {
  return useQuery({
    queryKey: switchStatusKeys.all,
    queryFn: async () => {
      const res = await api.user.getSwitchStatus();
      return res as SwitchStatusDto;
    },
    staleTime: 1000 * 15,
  });
};

export const useMessages = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: messageKeys.list(page, limit),
    queryFn: async () => {
      const res = await api.messages.list(page, limit);
      const list: MessageItem[] = Array.isArray(res) ? res : res?.messages || [];
      return {
        messages: list,
        total: list.length,
        pendingCount: list.filter((m) => m.status === "PENDING").length,
      };
    },
    staleTime: 1000 * 20,
  });
};

export const useMessage = (id: number | null | undefined) => {
  return useQuery({
    queryKey: messageKeys.detail(id as number),
    queryFn: async () => {
      if (!id) return null;
      const res = await api.messages.get(id);
      return res as MessageItem;
    },
    enabled: !!id,
    staleTime: 1000 * 20,
  });
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: messageCreationBodyType) => api.messages.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
      queryClient.invalidateQueries({ queryKey: switchStatusKeys.all });
    },
  });
};

export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: updateMessageBodyType }) =>
      api.messages.update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
      queryClient.invalidateQueries({ queryKey: switchStatusKeys.all });
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(variables.id) });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.messages.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
      queryClient.invalidateQueries({ queryKey: switchStatusKeys.all });
    },
  });
};
