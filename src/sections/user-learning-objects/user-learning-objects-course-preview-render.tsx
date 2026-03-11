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
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { UserLearningObjectsMediaViewer } from './user-learning-objects-media-viewer';

// ----------------------------------------------------------------------

type Props = {
  course: IAiCourse;
  onCompleteActivity?: (activityId: string) => Promise<void>;
};

// ----------------------------------------------------------------------

export function UserLearningObjectsCoursePreviewRender({ course, onCompleteActivity }: Props) {
  const { t } = useTranslate('learning');
  const [expandedSection, setExpandedSection] = useState<string | false>(
    course.sections?.[0]?.id || false
  );

  const handleSectionChange = (sectionId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? sectionId : false);
  };

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      {/* Course Header */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Banner */}
        {course.bannerUrl && (
          <Box
            sx={{
              mb: { xs: 2, sm: 3 },
              borderRadius: 2,
              overflow: 'hidden',
              height: { xs: 160, sm: 200, md: 240 },
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
        <Typography 
          variant="h3" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
            lineHeight: 1.2,
            mb: 2,
          }}
        >
          {course.title}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          paragraph
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          {course.description}
        </Typography>

        {/* Metadata */}
        <Stack 
          direction="row" 
          spacing={1} 
          flexWrap="wrap" 
          sx={{ 
            mb: 2, 
            gap: { xs: 0.75, sm: 1 },
            '& .MuiChip-root': {
              fontSize: { xs: '0.6875rem', sm: '0.8125rem' },
            }
          }}
        >
          <Chip
            icon={<Iconify icon="solar:star-bold" width={16} />}
            label={t(`learning-objects.details.preview.difficulty.${course.difficulty}`)}
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
            label={`${course.sections?.length || 0} ${t('learning-objects.details.preview.sections')}`}
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
          <Stack 
            direction="row" 
            spacing={0.5} 
            flexWrap="wrap" 
            sx={{ 
              gap: { xs: 0.5, sm: 0.75 },
              '& .MuiChip-root': {
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
              }
            }}
          >
            {course.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="soft" color="primary" />
            ))}
          </Stack>
        )}
      </Card>

      {/* Learning Objectives */}
      {course.objectives?.length > 0 && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.125rem', sm: '1.5rem' },
              display: 'flex',
              alignItems: 'center',
              mb: { xs: 1.5, sm: 2 },
            }}
          >
            <Iconify 
              icon="solar:flag-bold" 
              width={24}
              sx={{ 
                mr: 1,
                width: { xs: 20, sm: 24 },
                height: { xs: 20, sm: 24 },
              }} 
            />
            {t('learning-objects.details.preview.objectives')}
          </Typography>
          <Stack spacing={{ xs: 1.5, sm: 2 }}>
            {course.objectives.map((objective, index) => (
              <Stack key={index} direction="row" spacing={1.5} alignItems="flex-start">
                <Iconify
                  icon="solar:check-circle-bold"
                  width={20}
                  sx={{ 
                    color: 'success.main', 
                    mt: 0.25, 
                    flexShrink: 0,
                    width: { xs: 18, sm: 20 },
                    height: { xs: 18, sm: 20 },
                  }}
                />
                <Typography 
                  variant="body1"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {objective}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {/* Course Sections */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1.125rem', sm: '1.5rem' },
            display: 'flex',
            alignItems: 'center',
            mb: { xs: 1.5, sm: 2 },
          }}
        >
          <Iconify 
            icon="solar:notebook-bold-duotone" 
            width={24}
            sx={{ 
              mr: 1,
              width: { xs: 20, sm: 24 },
              height: { xs: 20, sm: 24 },
            }} 
          />
          {t('learning-objects.details.preview.content')}
        </Typography>

        {course.sections?.length > 0 ? (
          <Stack spacing={{ xs: 1, sm: 1.5 }}>
            {course.sections.map((section, index) => (
              <SectionAccordion
                key={section.id}
                section={section}
                index={index}
                expanded={expandedSection === section.id}
                onChange={handleSectionChange(section.id)}
                onCompleteActivity={onCompleteActivity}
              />
            ))}
          </Stack>
        ) : (
          <Alert severity="info">{t('learning-objects.details.preview.noContent')}</Alert>
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
  onCompleteActivity?: (activityId: string) => Promise<void>;
};

function SectionAccordion({ section, index, expanded, onChange, onCompleteActivity }: SectionAccordionProps) {
  const { t } = useTranslate('learning');

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
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.5, sm: 1.5 },
          '& .MuiAccordionSummary-content': {
            alignItems: { xs: 'flex-start', sm: 'center' },
            my: { xs: 1, sm: 1 },
            flexDirection: { xs: 'column', sm: 'row' },
          },
        }}
      >
        {/* Header row con número y duración (móvil) */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ 
            width: '100%',
            mb: { xs: 0.75, sm: 0 },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
            <Chip
              label={`${index + 1}`}
              size="small"
              color="primary"
              sx={{ 
                minWidth: { xs: 28, sm: 32 },
                height: { xs: 24, sm: 28 },
                '& .MuiChip-label': {
                  px: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                }
              }}
            />
            
            {/* Título solo en desktop */}
            <Typography 
              variant="subtitle1"
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.4,
                display: { xs: 'none', sm: 'block' },
                flex: 1,
              }}
            >
              {section.title}
            </Typography>
          </Stack>
          
          {/* Duración */}
          {section.duration && (
            <Chip
              icon={<Iconify icon="solar:clock-circle-bold" width={14} />}
              label={section.duration}
              size="small"
              variant="outlined"
              sx={{ 
                height: { xs: 24, sm: 28 },
                '& .MuiChip-label': {
                  fontSize: { xs: '0.6875rem', sm: '0.8125rem' },
                  px: { xs: 0.75, sm: 1 },
                },
                '& .MuiChip-icon': {
                  fontSize: { xs: 12, sm: 14 },
                },
              }}
            />
          )}
        </Stack>

        {/* Título y descripción en móvil */}
        <Box 
          sx={{ 
            width: '100%',
            display: { xs: 'block', sm: 'none' },
            pl: 0,
          }}
        >
          <Typography 
            variant="subtitle1"
            sx={{ 
              fontSize: '0.875rem',
              lineHeight: 1.4,
              fontWeight: 600,
              mb: section.description ? 0.5 : 0,
            }}
          >
            {section.title}
          </Typography>
          {section.description && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.75rem',
                lineHeight: 1.4,
                display: 'block',
              }}
            >
              {section.description}
            </Typography>
          )}
        </Box>

        {/* Descripción en desktop */}
        {section.description && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              fontSize: '0.75rem',
              display: { xs: 'none', sm: 'block' },
              ml: 2,
            }}
          >
            {section.description}
          </Typography>
        )}
      </AccordionSummary>
      <AccordionDetails
        sx={{
          px: { xs: 1.5, sm: 2 },
          pb: { xs: 1.5, sm: 2 },
        }}
      >
        <Divider sx={{ mb: { xs: 1.5, sm: 2 } }} />
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          {section.blocks?.map((block) => (
            <BlockRenderer key={block.id} block={block} onCompleteActivity={onCompleteActivity} />
          ))}
          {(!section.blocks || section.blocks.length === 0) && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontStyle: 'italic',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              }}
            >
              {t('learning-objects.details.preview.noBlocks')}
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
  onCompleteActivity?: (activityId: string) => Promise<void>;
};

function BlockRenderer({ block, onCompleteActivity }: BlockRendererProps) {
  const { t } = useTranslate('learning');
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCompleteHtmlActivity = async () => {
    if (!onCompleteActivity || block.isCompleted || isCompleting) return;
    
    setIsCompleting(true);
    try {
      await onCompleteActivity(block.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'html':
        return (
          <Box sx={{ position: 'relative' }}>
            {/* Checkbox en la esquina superior derecha */}
            {onCompleteActivity && (
              <Tooltip title={block.isCompleted ? t('learning-objects.details.preview.activityCompleted') : t('learning-objects.details.preview.markAsCompleted')}>
                <IconButton
                  onClick={handleCompleteHtmlActivity}
                  disabled={block.isCompleted || isCompleting}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    zIndex: 10,
                    bgcolor: block.isCompleted ? 'success.lighter' : 'grey.100',
                    boxShadow: 1,
                    '&:hover': {
                      bgcolor: block.isCompleted ? 'success.lighter' : 'grey.200',
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'success.lighter',
                      opacity: 1,
                    },
                  }}
                >
                  <Iconify 
                    icon={block.isCompleted ? 'solar:check-circle-bold' : 'eva:radio-button-off-fill'} 
                    width={24}
                    sx={{ 
                      color: block.isCompleted ? 'success.main' : 'text.disabled',
                    }}
                  />
                </IconButton>
              </Tooltip>
            )}
            
            <Box
              sx={{
                '& h2, & h3, & h4': {
                mb: 2,
                mt: 3,
                fontWeight: 600,
                '&:first-of-type': { mt: 0 },
              },
              '& h2': {
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                lineHeight: 1.3,
              },
              '& h3': {
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
                lineHeight: 1.3,
              },
              '& h4': {
                fontSize: { xs: '1rem', sm: '1.125rem' },
                lineHeight: 1.3,
              },
              '& p': {
                mb: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.6,
              },
              '& ul, & ol': {
                pl: { xs: 2, sm: 3 },
                mb: 2,
                '& li': {
                  mb: 0.5,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: 1.6,
                },
              },
              '& pre': {
                bgcolor: 'grey.900',
                color: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                mb: 2,
                '& code': {
                  fontFamily: 'monospace',
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  lineHeight: 1.5,
                  bgcolor: 'transparent',
                  p: 0,
                },
              },
              '& code': {
                bgcolor: 'grey.100',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontFamily: 'monospace',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                wordBreak: 'break-word',
              },
              '& strong': {
                fontWeight: 600,
              },
              '& em': {
                fontStyle: 'italic',
              },
              '& blockquote': {
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                pl: 2,
                py: 1,
                my: 2,
                bgcolor: 'grey.50',
                fontStyle: 'italic',
              },
              '& .quiz-block': {
                bgcolor: 'primary.lighter',
                p: 2,
                borderRadius: 1,
                mt: 3,
                mb: 2,
              },
            }}
            dangerouslySetInnerHTML={{ __html: block.content.html || '' }}
          />
        </Box>
        );

      case 'heading': {
        const level = block.content.level || 2;
        return (
          <Typography 
            variant={`h${level}` as any}
            sx={{
              fontSize: { 
                xs: level === 2 ? '1.25rem' : level === 3 ? '1.125rem' : '1rem',
                sm: level === 2 ? '1.5rem' : level === 3 ? '1.25rem' : '1.125rem',
              },
              lineHeight: 1.3,
            }}
          >
            {block.content.text}
          </Typography>
        );
      }

      case 'paragraph':
      case 'text':
        return (
          <Box
            sx={{
              '& p': { 
                mb: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.6,
              },
              '& ul, & ol': { 
                pl: { xs: 2, sm: 3 },
                '& li': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
              },
              '& code': {
                bgcolor: 'grey.100',
                px: 0.5,
                borderRadius: 0.5,
                fontFamily: 'monospace',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                wordBreak: 'break-word',
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
          <Box component={ListTag} sx={{ pl: { xs: 2, sm: 3 } }}>
            {block.content.items?.map((item, index) => (
              <Typography 
                component="li" 
                key={index} 
                sx={{ 
                  mb: 0.5,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
              >
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
              p: { xs: 1.5, sm: 2 },
              borderRadius: 1,
              bgcolor: 'grey.900',
              color: 'common.white',
              overflow: 'auto',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontFamily: 'monospace',
              maxWidth: '100%',
              '& code': {
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              },
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
          <UserLearningObjectsMediaViewer
            media={[
              {
                id: block.id,
                type: block.type as any,
                url: block.content.url || '',
                name: block.content.caption || block.content.altText || '',
                caption: block.content.caption,
                altText: block.content.altText,
                thumbnailUrl: block.content.thumbnailUrl,
                bannerUrl: block.content.thumbnailUrl || block.content.bannerUrl,
              },
            ]}
            blockId={block.id}
            isCompleted={block.isCompleted}
            onCompleteActivity={onCompleteActivity}
          />
        );

      case 'callout': {
        const calloutSeverity = block.content.calloutType === 'tip' ? 'info' : block.content.calloutType || 'info';
        return (
          <Alert
            severity={calloutSeverity as any}
            sx={{ 
              '& .MuiAlert-message': { width: '100%' },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            }}
          >
            {block.content.title && (
              <Typography 
                variant="subtitle2" 
                gutterBottom
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {block.content.title}
              </Typography>
            )}
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
            >
              {block.content.text}
            </Typography>
          </Alert>
        );
      }

      case 'divider':
        return <Divider />;

      case 'quiz':
        return (
          <Card variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center" 
              sx={{ mb: { xs: 1.5, sm: 2 } }}
            >
              <Iconify 
                icon="solar:info-circle-bold" 
                width={20}
                color="primary.main"
                sx={{
                  width: { xs: 18, sm: 20 },
                  height: { xs: 18, sm: 20 },
                }} 
              />
              <Typography 
                variant="subtitle1"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {t('learning-objects.details.preview.quiz')}
              </Typography>
            </Stack>
            <Typography 
              variant="body1" 
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {block.content.question}
            </Typography>
            <Stack spacing={1} sx={{ mt: { xs: 1.5, sm: 2 } }}>
              {block.content.options?.map((option, index) => (
                <Box
                  key={option.id}
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                  }}
                >
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                  >
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
            {t('learning-objects.details.preview.unknownBlock')}: {block.type}
          </Typography>
        );
    }
  };

  return <Box>{renderBlockContent()}</Box>;
};