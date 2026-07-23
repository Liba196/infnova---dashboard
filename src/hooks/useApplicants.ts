import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getApplicants, getApplicant, updateApplicantStatus } from '../lib/endpoints';
import type { ApplicantListParams, ApplicantStatus } from '../types/applicant';
import { useAuth } from '../context/AuthContext';

export function useApplicants(params: ApplicantListParams) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['applicants', params],
    queryFn: () => getApplicants(params, token!),
    enabled: !!token,
    placeholderData: (prev) => prev, // keep old page visible while the next page loads
  });
}

export function useApplicant(id: string | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['applicant', id],
    queryFn: () => getApplicant(id!, token!),
    enabled: !!token && !!id,
  });
}

export function useUpdateApplicantStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicantStatus }) =>
      updateApplicantStatus(id, status, token!),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      queryClient.invalidateQueries({ queryKey: ['applicant', variables.id] });
      toast.success('Status updated.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not update status.');
    },
  });
}
