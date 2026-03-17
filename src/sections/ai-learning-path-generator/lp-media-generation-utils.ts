// ----------------------------------------------------------------------
// Learning Path - Media Generation Utilities
// Handles image/video generation for courses and programs
// using the centralized toolbar provider configuration.
// ----------------------------------------------------------------------

import type { IAiCourse } from 'src/types/ai-course';
import type { IAiProgram } from 'src/types/ai-program-generation';
import type { ILPProviderConfig } from 'src/types/ai-learning-path';

// ----------------------------------------------------------------------

/**
 * Generate all media (banner, section images, section videos) for a course.
 * Returns a new course object with updated URLs.
 */
export async function generateCourseMedia(
  courseData: IAiCourse,
  providerConfig: ILPProviderConfig
): Promise<IAiCourse> {
  const { imageProvider, imageModel, videoProvider, getLegacyProviderType } = providerConfig;

  let updatedBannerUrl = courseData.bannerUrl || '';
  let updatedSections = [...(courseData.sections || [])];

  // 1. Generate banner image
  if (courseData.banner && imageProvider && imageModel) {
    try {
      const { GenerateAndUploadAiImageService } = await import(
        'src/services/ai/GenerateAiImage.service'
      );
      const bannerResult = await GenerateAndUploadAiImageService({
        prompt: courseData.banner,
        size: '1536x1024',
        provider: getLegacyProviderType(imageProvider),
        model: imageModel.modelKey,
      });
      if (bannerResult?.imageUrl) {
        updatedBannerUrl = bannerResult.imageUrl;
      }
    } catch (err) {
      console.error('[LP Course] Failed to generate banner:', err);
    }
  }

  // 2. Generate section images
  if (courseData.generateImages && imageProvider && imageModel) {
    const sectionsNeedingImages = updatedSections.filter(
      (s) => s.needsImage && s.image && s.image.trim()
    );

    if (sectionsNeedingImages.length > 0) {
      try {
        const { GenerateCourseImagesService } = await import(
          'src/services/ai/GenerateAiImage.service'
        );
        const imageResults = await GenerateCourseImagesService(
          courseData.title,
          sectionsNeedingImages,
          {
            provider: getLegacyProviderType(imageProvider),
            model: imageModel.modelKey,
          }
        );

        updatedSections = updatedSections.map((section) => {
          if (!section.needsImage || !section.image || !section.image.trim()) return section;

          const sectionIndex = sectionsNeedingImages.findIndex((s) => s.title === section.title);
          const imageResult = imageResults.find((r) => r.sectionIndex === sectionIndex);
          const images = [...(section.images || [])];
          const blocks = [...(section.blocks || [])];

          if (imageResult?.imageUrl) {
            images.push({ url: imageResult.imageUrl });
            blocks.push({
              id: crypto.randomUUID(),
              type: 'image' as const,
              order: blocks.length,
              sectionId: section.id,
              content: {
                url: imageResult.imageUrl,
                altText: section.image || section.title,
                caption: section.image,
              },
            });
          }

          return {
            ...section,
            images,
            blocks,
            imageUrl: imageResult?.imageUrl || section.imageUrl,
          };
        });
      } catch (err) {
        console.error('[LP Course] Failed to generate section images:', err);
      }
    }
  }

  // 3. Generate section videos
  if (courseData.generateVideos && videoProvider) {
    const sectionsNeedingVideos = updatedSections.filter(
      (s) => s.needsVideo && s.video && s.video.trim()
    );

    if (sectionsNeedingVideos.length > 0) {
      try {
        if (videoProvider.name === 'Propietario') {
          // Proprietary video generation (one section at a time)
          const { GenerateProprietaryCourseVideoService } = await import(
            'src/services/ai/ProprietaryVideoGeneration.service'
          );
          const videoResults: Array<{ sectionIndex: number; videoUrl: string; videoId: string }> =
            [];

          for (let i = 0; i < sectionsNeedingVideos.length; i++) {
            try {
              const result = await GenerateProprietaryCourseVideoService(
                courseData.title,
                sectionsNeedingVideos[i],
                {
                  duration_scences: providerConfig.proprietaryDurationScenes,
                  scences_number: providerConfig.proprietaryScenesNumber,
                  image_model: providerConfig.proprietaryImageModel,
                }
              );
              videoResults.push({
                sectionIndex: i,
                videoUrl: result.videoUrl,
                videoId: result.videoId,
              });
            } catch (videoErr) {
              console.error(
                `[LP Course] Failed to generate proprietary video for section ${i}:`,
                videoErr
              );
            }
          }

          updatedSections = applyVideoResults(
            updatedSections,
            sectionsNeedingVideos,
            videoResults
          );
        } else {
          // Standard video generation
          const { GenerateCourseVideosService } = await import(
            'src/services/ai/GenerateAiVideo.service'
          );
          const videoResults = await GenerateCourseVideosService(
            courseData.title,
            sectionsNeedingVideos,
            {
              provider: getLegacyProviderType(videoProvider),
              seconds: 12,
            }
          );

          updatedSections = applyVideoResults(
            updatedSections,
            sectionsNeedingVideos,
            videoResults
          );
        }
      } catch (err) {
        console.error('[LP Course] Failed to generate section videos:', err);
      }
    }
  }

  // Strip generateImages/generateVideos — backend does not accept them
  const rest = { ...courseData };
  delete rest.generateImages;
  delete rest.generateVideos;

  return {
    ...rest,
    bannerUrl: updatedBannerUrl,
    sections: updatedSections,
  };
}

// ----------------------------------------------------------------------

/**
 * Apply video results to sections (shared by both proprietary and standard).
 */
function applyVideoResults(
  sections: IAiCourse['sections'],
  sectionsNeedingVideos: IAiCourse['sections'],
  videoResults: Array<{ sectionIndex: number; videoUrl: string; videoId: string }>
): IAiCourse['sections'] {
  return sections.map((section) => {
    if (!section.needsVideo || !section.video || !section.video.trim()) return section;

    const sectionIndex = sectionsNeedingVideos.findIndex((s) => s.title === section.title);
    const videoResult = videoResults.find((r) => r.sectionIndex === sectionIndex);
    const videos = [...(section.videos || [])];
    const blocks = [...(section.blocks || [])];

    if (videoResult?.videoUrl) {
      videos.push({ url: videoResult.videoUrl, videoId: videoResult.videoId });
      blocks.push({
        id: crypto.randomUUID(),
        type: 'video' as const,
        order: blocks.length,
        sectionId: section.id,
        content: {
          url: videoResult.videoUrl,
          caption: section.video,
        },
      });
    }

    return {
      ...section,
      videos,
      blocks,
      videoUrl: videoResult?.videoUrl || section.videoUrl,
    };
  });
}

// ----------------------------------------------------------------------

/**
 * Generate banner and cover images for a program.
 * Returns a new program data object with bannerUrl and imageUrl set.
 */
export async function generateProgramMedia(
  programData: Partial<IAiProgram>,
  providerConfig: ILPProviderConfig
): Promise<Partial<IAiProgram>> {
  const { imageProvider, imageModel, getLegacyProviderType } = providerConfig;

  if (!imageProvider || !imageModel) return programData;

  let bannerUrl = programData.bannerUrl || '';
  let imageUrl = programData.imageUrl || '';

  // Generate banner
  if (programData.generateBanner && programData.banner && programData.banner.trim()) {
    try {
      const { GenerateAndUploadAiImageService } = await import(
        'src/services/ai/GenerateAiImage.service'
      );
      const result = await GenerateAndUploadAiImageService({
        prompt: programData.banner,
        size: '1536x1024',
        provider: getLegacyProviderType(imageProvider),
        model: imageModel.modelKey,
      });
      if (result?.imageUrl) bannerUrl = result.imageUrl;
    } catch (err) {
      console.error('[LP Program] Failed to generate banner:', err);
    }
  }

  // Generate cover
  if (programData.generateCover && programData.cover && programData.cover.trim()) {
    try {
      const { GenerateAndUploadAiImageService } = await import(
        'src/services/ai/GenerateAiImage.service'
      );
      const result = await GenerateAndUploadAiImageService({
        prompt: programData.cover,
        size: '1024x1024',
        provider: getLegacyProviderType(imageProvider),
        model: imageModel.modelKey,
      });
      if (result?.imageUrl) imageUrl = result.imageUrl;
    } catch (err) {
      console.error('[LP Program] Failed to generate cover:', err);
    }
  }

  return { ...programData, bannerUrl, imageUrl };
}
