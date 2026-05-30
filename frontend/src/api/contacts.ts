import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@src/services/axios';
import { handleApiError } from '@src/services/errors';

export interface Contact {
  contact_id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateContactData {
  name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
}

export interface UpdateContactData extends Partial<CreateContactData> {
  contact_id: string;
}

type ApiEnvelope<T> = {
  code: number;
  url: string;
  message: T;
};

export const useContacts = (user_id: string) => {
  return useQuery({
    queryKey: ['contacts', user_id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Contact[] | string>>(`/api/contacts/${user_id}`);
      return Array.isArray(data.message) ? data.message : [];
    },
    enabled: !!user_id,
  });
};

export const useContact = (userId: string, contactId: string) => {
  return useQuery({
    queryKey: ['contacts', userId, contactId],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Contact[] | string>>(`/api/contacts/${userId}`);
      const list = Array.isArray(data.message) ? data.message : [];
      return list.find((c) => c.contact_id === contactId) ?? null;
    },
    enabled: !!userId && !!contactId,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, contactData }: { user_id: string; contactData: CreateContactData }) => {
      const { data } = await api.post<ApiEnvelope<Contact | string>>(`/api/contacts/${user_id}`, { data: contactData });
      return data.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, contact_id, ...contactData }: UpdateContactData & { user_id: string }) => {
      const { data } = await api.put<ApiEnvelope<Contact | string>>(`/api/contacts/${user_id}`, { data: { contact_id, ...contactData } });
      return data.message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.user_id, variables.contact_id] });
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, contact_id }: { user_id: string; contact_id: string }) => {
      await api.delete(`/api/contacts/${user_id}`, { data: { contact_id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};