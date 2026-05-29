// ----------------------------------------------------------------------
// useAiCourse Hook - State management for AI Course
// ----------------------------------------------------------------------

import type { IAiCourseBlock } from 'src/types/ai-course-block';
import type { IAiCourse, IAiCourseSection, IAiCourseFormData } from 'src/types/ai-course';

import { useState, useCallback } from 'react';

// ----------------------------------------------------------------------

interface AiCourseState {
  course: IAiCourse | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
}

const initialState: AiCourseState = {
  course: null,
  isLoading: false,
  isSaving: false,
  isDirty: false,
  errors: {},
};

// ----------------------------------------------------------------------

export function useAiCourse(initialCourse?: IAiCourse) {
  const [state, setState] = useState<AiCourseState>({
    ...initialState,
    course: initialCourse || null,
  });

  // Set course data
  const setCourse = useCallback((course: IAiCourse | null) => {
    setState((prev) => ({ ...prev, course, isDirty: false }));
  }, []);

  // Update course fields
  const updateCourse = useCallback((updates: Partial<IAiCourse>) => {
    setState((prev) => ({
      ...prev,
      course: prev.course ? { ...prev.course, ...updates } : null,
      isDirty: true,
    }));
  }, []);

  // Update form data
  const updateFormData = useCallback((formData: Partial<IAiCourseFormData>) => {
    setState((prev) => ({
      ...prev,
      course: prev.course ? { ...prev.course, ...formData } : null,
      isDirty: true,
    }));
  }, []);

  // Add section
  const addSection = useCallback((section: IAiCourseSection) => {
    setState((prev) => {
      if (!prev.course) return prev;
      return {
        ...prev,
        course: {
          ...prev.course,
          sections: [...prev.course.sections, section],
        },
        isDirty: true,
      };
    });
  }, []);

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<IAiCourseSection>) => {
    setState((prev) => {
      if (!prev.course) return prev;
      return {
        ...prev,
        course: {
          ...prev.course,
          sections: prev.course.sections.map((section: IAiCourseSection) =>
            section.id === sectionId ? { ...section, ...updates } : section
          ),
        },
        isDirty: true,
      };
    });
  }, []);

  // Remove section
  const removeSection = useCallback((sectionId: string) => {
    setState((prev) => {
      if (!prev.course) return prev;
      return {
        ...prev,
        course: {
          ...prev.course,
          sections: prev.course.sections.filter((section: IAiCourseSection) => section.id !== sectionId),
        },
        isDirty: true,
      };
    });
  }, []);

  // Reorder sections
  const reorderSections = useCallback((startIndex: number, endIndex: number) => {
    setState((prev) => {
      if (!prev.course) return prev;
      const newSections = [...prev.course.sections];
      const [removed] = newSections.splice(startIndex, 1);
      newSections.splice(endIndex, 0, removed);

      // Update order property
      const reorderedSections = newSections.map((section, index) => ({
        ...section,
        order: index,
      }));

      return {
        ...prev,
        course: {
          ...prev.course,
          sections: reorderedSections,
        },
        isDirty: true,
      };
    });
  }, []);

  // Add block to section
  const addBlock = useCallback((sectionId: string, block: IAiCourseBlock) => {
    setState((prev) => {
      if (!prev.course) return prev;
      return {
        ...prev,
        course: {
          ...prev.course,
          sections: prev.course.sections.map((section: IAiCourseSection) =>
            section.id === sectionId
              ? { ...section, blocks: [...section.blocks, block] }
              : section
          ),
        },
        isDirty: true,
      };
    });
  }, []);

  // Update block
  const updateBlock = useCallback((sectionId: string, blockId: string, updates: Partial<IAiCourseBlock>) => {
    setState((prev) => {
      if (!prev.course) return prev;
      return {
        ...prev,
        course: {
          ...prev.course,
          sections: prev.course.sections.map((section: IAiCourseSection) =>
            section.id === sectionId
              ? {
                ...section,
                blocks: section.blocks.map((block: IAiCourseBlock) =>
                  block.id === blockId ? { ...block, ...updates } : block
                ),
              }
              : section
          ),
        },
        isDirty: true,
      };
    });
  }, []);

  // Remove block
  const removeBlock = useCallback((sectionId: string, blockId: string) => {
    setState((prev) => {
      if (!prev.course) return prev;
      return {
        ...prev,
        course: {
          ...prev.course,
          sections: prev.course.sections.map((section: IAiCourseSection) =>
            section.id === sectionId
              ? { ...section, blocks: section.blocks.filter((block: IAiCourseBlock) => block.id !== blockId) }
              : section
          ),
        },
        isDirty: true,
      };
    });
  }, []);

  // Set loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  // Set saving state
  const setSaving = useCallback((isSaving: boolean) => {
    setState((prev) => ({ ...prev, isSaving }));
  }, []);

  // Set errors
  const setErrors = useCallback((errors: Record<string, string>) => {
    setState((prev) => ({ ...prev, errors }));
  }, []);

  // Clear errors
  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, errors: {} }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // Mark as clean (after save)
  const markClean = useCallback(() => {
    setState((prev) => ({ ...prev, isDirty: false }));
  }, []);

  return {
    // State
    course: state.course,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isDirty: state.isDirty,
    errors: state.errors,

    // Course actions
    setCourse,
    updateCourse,
    updateFormData,

    // Section actions
    addSection,
    updateSection,
    removeSection,
    reorderSections,

    // Block actions
    addBlock,
    updateBlock,
    removeBlock,

    // State actions
    setLoading,
    setSaving,
    setErrors,
    clearErrors,
    reset,
    markClean,
  };
}
