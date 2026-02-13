'use client';

// ----------------------------------------------------------------------
// AI Course Preview Render Component
// ----------------------------------------------------------------------

import type { IAiCourseBlock } from 'src/types/ai-course-block';
import type { IAiCourse, IAiCourseSection } from 'src/types/ai-course';

import { useState } from 'react';
import rehypeRaw from 'rehype-raw';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { AiCourseMediaViewer } from 'src/sections/ai-course-generator/ai-course-media-viewer';

// ----------------------------------------------------------------------

type Props = {
  course: IAiCourse;
};

// ----------------------------------------------------------------------

export function AiCoursePreviewRender({ course }: Props) {
  const { t } = useTranslate('ai-course');
  const [expandedSection, setExpandedSection] = useState<string | false>(
    course.sections?.[0]?.id || false
  );

  const handleSectionChange = (sectionId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? sectionId : false);
  };

  return (
    <Stack spacing={3}>
      {/* Course Header */}
      <Card sx={{ p: 3 }}>
        {/* Banner */}
        {course.bannerUrl && (
          <Box
            sx={{
              mb: 3,
              borderRadius: 2,
              overflow: 'hidden',
              height: 200,
              bgcolor: 'grey.100',
            }}
          >
            <img
              src={course.bannerUrl}
              alt={course.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
        )}

        {/* Title & Description */}
        <Typography variant="h3" gutterBottom>
          {course.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {course.description}
        </Typography>

        {/* Metadata */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
          <Chip
            icon={<Iconify icon="solar:star-bold" width={16} />}
            label={t(`difficulty.${course.difficulty}`)}
            size="small"
            color={
              course.difficulty === 'beginner'
                ? 'success'
                : course.difficulty === 'intermediate'
                  ? 'warning'
                  : 'error'
            }
          />
          <Chip
            icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
            label={course.duration}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<Iconify icon="solar:list-bold" width={16} />}
            label={`${course.sections?.length || 0} ${t('sections')}`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<Iconify icon="solar:users-group-rounded-bold" width={16} />}
            label={course.targetAudience}
            size="small"
            variant="outlined"
          />
        </Stack>

        {/* Tags */}
        {course.tags?.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            {course.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="soft" color="primary" />
            ))}
          </Stack>
        )}
      </Card>

      {/* Learning Objectives */}
      {course.objectives?.length > 0 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            <Iconify icon="solar:flag-bold" width={24} sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('preview.objectives')}
          </Typography>
          <Stack spacing={1}>
            {course.objectives.map((objective, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                <Iconify
                  icon="solar:check-circle-bold"
                  width={20}
                  sx={{ color: 'success.main', mt: 0.25 }}
                />
                <Typography variant="body1">{objective}</Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {/* Course Sections */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          <Iconify icon="solar:notebook-bold-duotone" width={24} sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('preview.content')}
        </Typography>

        {course.sections?.length > 0 ? (
          <Stack spacing={1}>
            {course.sections.map((section, index) => (
              <SectionAccordion
                key={section.id}
                section={section}
                index={index}
                expanded={expandedSection === section.id}
                onChange={handleSectionChange(section.id)}
              />
            ))}
          </Stack>
        ) : (
          <Alert severity="info">{t('preview.noContent')}</Alert>
        )}
      </Card>
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Section Accordion
// ----------------------------------------------------------------------

type SectionAccordionProps = {
  section: IAiCourseSection;
  index: number;
  expanded: boolean;
  onChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
};

function SectionAccordion({ section, index, expanded, onChange }: SectionAccordionProps) {
  const { t } = useTranslate('ai-course');

  return (
    <Accordion
      expanded={expanded}
      onChange={onChange}
      sx={{
        '&:before': { display: 'none' },
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        '&.Mui-expanded': {
          margin: 0,
        },
      }}
    >
      <AccordionSummary
        expandIcon={<Iconify icon="solar:double-alt-arrow-down-bold-duotone" />}
        sx={{
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
          },
        }}
      >
        <Chip
          label={`${index + 1}`}
          size="small"
          color="primary"
          sx={{ mr: 2, minWidth: 32 }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1">{section.title}</Typography>
          {section.description && (
            <Typography variant="caption" color="text.secondary">
              {section.description}
            </Typography>
          )}
        </Box>
        {section.duration && (
          <Chip
            icon={<Iconify icon="solar:clock-circle-bold" width={14} />}
            label={section.duration}
            size="small"
            variant="outlined"
            sx={{ mr: 2 }}
          />
        )}
      </AccordionSummary>
      <AccordionDetails>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2}>
          {section.blocks?.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
          {(!section.blocks || section.blocks.length === 0) && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('preview.noBlocks')}
            </Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

// ----------------------------------------------------------------------
// Block Renderer
// ----------------------------------------------------------------------

type BlockRendererProps = {
  block: IAiCourseBlock;
};

function BlockRenderer({ block }: BlockRendererProps) {
  const { t } = useTranslate('ai-course');

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading': {
        return (
          <Typography variant={`h${block.content.level || 2}` as any}>
            {block.content.text}
          </Typography>
        );
      }

      case 'paragraph':
      case 'text':
        return (
          <Box
            sx={{
              '& p': { mb: 2 },
              '& ul, & ol': { pl: 3 },
              '& code': {
                bgcolor: 'grey.100',
                px: 0.5,
                borderRadius: 0.5,
                fontFamily: 'monospace',
              },
            }}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
              {block.content.text || ''}
            </ReactMarkdown>
          </Box>
        );

      case 'list': {
        const ListTag = block.content.listType === 'ordered' ? 'ol' : 'ul';
        return (
          <Box component={ListTag} sx={{ pl: 3 }}>
            {block.content.items?.map((item, index) => (
              <Typography component="li" key={index} sx={{ mb: 0.5 }}>
                {item}
              </Typography>
            ))}
          </Box>
        );
      }

      case 'code':
        return (
          <Box
            component="pre"
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'grey.900',
              color: 'common.white',
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
            }}
          >
            <code className={`language-${block.content.language || 'text'}`}>
              {block.content.code}
            </code>
          </Box>
        );

      case 'image':
      case 'video':
      case 'audio':
      case 'document':
        return (
          <AiCourseMediaViewer
            media={[
              {
                id: block.id,
                type: block.type as any,
                url: block.content.url || '',
                name: block.content.caption || '',
                caption: block.content.caption,
                altText: block.content.altText,
              },
            ]}
          />
        );

      case 'callout': {
        const calloutSeverity = block.content.calloutType === 'tip' ? 'info' : block.content.calloutType || 'info';
        return (
          <Alert
            severity={calloutSeverity as any}
            sx={{ '& .MuiAlert-message': { width: '100%' } }}
          >
            {block.content.title && (
              <Typography variant="subtitle2" gutterBottom>
                {block.content.title}
              </Typography>
            )}
            <Typography variant="body2">{block.content.text}</Typography>
          </Alert>
        );
      }

      case 'divider':
        return <Divider />;

      case 'quiz':
        return (
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Iconify icon="solar:info-circle-bold" width={20} color="primary.main" />
              <Typography variant="subtitle1">{t('preview.quiz')}</Typography>
            </Stack>
            <Typography variant="body1" gutterBottom>
              {block.content.question}
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {block.content.options?.map((option, index) => (
                <Box
                  key={option.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                  }}
                >
                  <Typography variant="body2">
                    {String.fromCharCode(65 + index)}. {option.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        );

      case 'embed':
        return (
          <Box
            sx={{
              position: 'relative',
              pt: '56.25%',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <iframe
              src={block.content.embedUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allowFullScreen
              title={block.content.caption || 'Embedded content'}
            />
          </Box>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            {t('preview.unknownBlock')}: {block.type}
          </Typography>
        );
    }
  };

  return <Box>{renderBlockContent()}</Box>;
}
