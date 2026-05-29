import type { IAiCourse, IAiCoursePaginationParams, IAiCoursePaginationResponse } from 'src/types/ai-course';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

/**
 * Save or update an AI course
 * @param course - Course data to save/update
 * @param id - Optional course ID for updates
 */
export async function SaveOrUpdateAiCourseGenerationService(
  course: Partial<IAiCourse>,
  id?: string
): Promise<{ data: IAiCourse; statusCode: number }> {
  try {
    let response;

    if (id) {
      // Update existing course
      response = await axios.patch(`${endpoints.ai.courseGenerator.update}/${id}`, course);
    } else {
      // Create new course
      response = await axios.post(endpoints.ai.courseGenerator.save, course);
    }

    return {
      data: response.data?.data || response.data,
      statusCode: response.status || 200,
    };
  } catch (error: any) {
    console.error('Error saving/updating AI course:', error);
    throw error;
  }
}

/**
 * Get paginated list of AI courses
 */
export async function GetAiCoursesPaginationService(
  params: IAiCoursePaginationParams
): Promise<{ data: IAiCoursePaginationResponse }> {
  try {
    const response = await axios.get(endpoints.ai.courseGenerator.all, { params });
    return response;
  } catch (error: any) {
    console.error('Error fetching AI courses:', error);
    throw error;
  }
}

/**
 * Get a single AI course by ID
 */
export async function GetAiCourseByIdService(
  id: string
): Promise<{ data: IAiCourse }> {
  try {
    const response = await axios.get(`${endpoints.ai.courseGenerator.edit}/${id}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching AI course:', error);
    throw error;
  }
}

/**
 * Delete an AI course
 */
export async function DeleteAiCourseService(
  id: string
): Promise<{ data: { statusCode: number } }> {
  try {
    const response = await axios.delete(`${endpoints.ai.courseGenerator.delete}/${id}`);
    return {
      data: {
        statusCode: response.status || 200,
      },
    };
  } catch (error: any) {
    console.error('Error deleting AI course:', error);
    throw error;
  }
}
