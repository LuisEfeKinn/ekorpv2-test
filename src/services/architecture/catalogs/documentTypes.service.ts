import type { DocumentTypePayload } from 'src/types/architecture/catalogs/document-types';

import axios, { endpoints } from 'src/utils/axios';

export const GetDocumentTypesPaginationService = async (params: Record<string, unknown>) => {
  const response = await axios.get<unknown>(endpoints.architecture.catalogs.documentTypes.all, {
    params: { ...params, _t: new Date().getTime() },
  });

  if (Array.isArray(response.data)) return response;

  const data = response.data as { data?: unknown; totalItems?: unknown } | null;

  if (data?.data) {
    const items = data.data;
    const totalItems = data.totalItems;
    const total =
      typeof totalItems === 'number'
        ? totalItems
        : Array.isArray(items)
          ? items.length
          : 0;

    return { ...response, data: [items, total] };
  }

  return response;
};

export const SaveOrUpdateDocumentTypeService = async (
  dataSend: DocumentTypePayload,
  id?: number
) => {
  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.documentTypes.update}/${id}`;
    return axios.patch(updateEndpoint, dataSend);
  }

  return axios.post(endpoints.architecture.catalogs.documentTypes.save, dataSend);
};

export const GetDocumentTypeByIdService = async (id: string | number) => {
  const editEndpoint = `${endpoints.architecture.catalogs.documentTypes.edit}/${id}`;
  const response = await axios.get<unknown>(editEndpoint);

  const data = response.data as { data?: unknown } | null;

  if (response.data && !data?.data) {
    (response as { data: unknown }).data = { data: response.data };
  }

  return response as typeof response & { data: { data: unknown } };
};

export const DeleteDocumentTypeService = async (id: string | number) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.documentTypes.delete}/${id}`;
  return axios.delete(deleteEndpoint);
};
