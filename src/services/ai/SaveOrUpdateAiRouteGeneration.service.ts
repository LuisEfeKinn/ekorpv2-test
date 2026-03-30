import type { IAiRoute, IAiRoutePaginationParams, IAiRoutePaginationResponse } from 'src/types/ai-route-generation';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

/**
 * Save or update an AI learning route (learning path)
 */
export async function SaveOrUpdateAiRouteGenerationService(
  route: Partial<IAiRoute>,
  id?: string
): Promise<{ data: IAiRoute; statusCode: number }> {
  let response;

  if (id) {
    response = await axios.patch(`${endpoints.ai.routeGenerator.update}/${id}`, route);
  } else {
    response = await axios.post(endpoints.ai.routeGenerator.save, route);
  }

  return {
    data: response.data?.data || response.data,
    statusCode: response.status || 200,
  };
}

/**
 * Get paginated list of AI learning routes
 */
export async function GetAiRoutesPaginationService(
  params: IAiRoutePaginationParams
): Promise<{ data: IAiRoutePaginationResponse }> {
  const response = await axios.get(endpoints.ai.routeGenerator.all, { params });
  return response;
}

/**
 * Get a single AI learning route by ID
 */
export async function GetAiRouteByIdService(
  id: string
): Promise<{ data: IAiRoute }> {
  const response = await axios.get(`${endpoints.ai.routeGenerator.edit}/${id}`);
  return response;
}

/**
 * Delete an AI learning route
 */
export async function DeleteAiRouteService(
  id: string
): Promise<{ data: { statusCode: number } }> {
  const response = await axios.delete(`${endpoints.ai.routeGenerator.delete}/${id}`);
  return {
    data: {
      statusCode: response.status || 200,
    },
  };
}
