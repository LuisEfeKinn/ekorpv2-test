// AI Program Generator Service
// Uses learning objects endpoints for persistence
// ----------------------------------------------------------------------

import type {
  IAiProgram,
  IAiProgramPaginationParams,
  IAiProgramPaginationResponse,
} from 'src/types/ai-program-generation';

import axios, { endpoints } from 'src/utils/axios';

import { SaveOrUpdateLearningObjectsService } from 'src/services/learning/learningObjects.service';

// ----------------------------------------------------------------------

/**
 * Save or update an AI-generated program (learning object)
 */
export async function SaveOrUpdateAiProgramService(
  program: Partial<IAiProgram>,
  id?: string
) {
  const payload = {
    name: program.name || '',
    duration: program.duration || '',
    description: program.description || '',
    imageUrl: program.imageUrl || '',
    videoUrl: program.videoUrl || '',
    bannerUrl: program.bannerUrl || '',
    isActive: program.isActive ?? false,
    objective: program.objective || '',
    skillsToAcquire: program.skillsToAcquire || '',
    whatYouWillLearn: program.whatYouWillLearn || '',
    tags: program.tags || '',
    isAIGenerated: true,
    order: program.order ?? 1,
    categoryId: program.categoryId ? Number(program.categoryId) : undefined,
    difficultyLevelId: program.difficultyLevelId ? Number(program.difficultyLevelId) : undefined,
    courses: (program.courses || []).map((c) => ({
      courseLmsId: c.courseLmsId,
      order: c.order,
    })),
  };

  return SaveOrUpdateLearningObjectsService(payload, id);
}

/**
 * Get paginated list of AI programs (learning objects with isAIGenerated=true)
 */
export async function GetAiProgramsPaginationService(
  params: IAiProgramPaginationParams
): Promise<{ data: IAiProgramPaginationResponse }> {
  const response = await axios.get(endpoints.learning.learningObjects.all, {
    params: { ...params, isAIGenerated: true },
  });
  return response;
}

/**
 * Get a single AI program by ID
 */
export async function GetAiProgramByIdService(
  id: string
): Promise<{ data: IAiProgram }> {
  const response = await axios.get(`${endpoints.learning.learningObjects.edit}/${id}`);
  return response;
}

/**
 * Delete an AI program
 */
export async function DeleteAiProgramService(
  id: string
): Promise<{ data: { statusCode: number } }> {
  const response = await axios.delete(`${endpoints.learning.learningObjects.delete}/${id}`);
  return {
    data: {
      statusCode: response.status || 200,
    },
  };
}
