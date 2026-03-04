import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@src/services/axios';

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

export const useContacts = (user_id: string) => {
  return useQuery({
    queryKey: ['contacts', user_id],
    queryFn: async () => {
      const { data } = await api.get<Contact[]>(`/contacts/${user_id}`);
      return data;
    },
  });
};

export const useContact = (contactId: string) => {
  return useQuery({
    queryKey: ['contacts', contactId],
    queryFn: async () => {
      const { data } = await api.get<Contact>(`/contacts/${contactId}`);
      return data;
    },
    enabled: !!contactId,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactData: CreateContactData) => {
      const { data } = await api.post<Contact>('/contacts', contactData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contact_id, ...contactData }: UpdateContactData) => {
      const { data } = await api.patch<Contact>(`/contacts/${contact_id}`, contactData);
      return data;
    },
    onSuccess: (_, { contact_id }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', contact_id] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      await api.delete(`/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}; 