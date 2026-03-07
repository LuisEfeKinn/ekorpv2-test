'use client';

import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { IScale, IObjective, ITestQuestion, ITestObjective, IConfigureTest, ITestCompetence } from 'src/types/performance';

import * as z from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { memo, useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import {
  draggable,
  monitorForElements,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetScalesPaginationService } from 'src/services/performance/scales.service';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';
import { SaveOrUpdateConfigureTestsService } from 'src/services/performance/configure-tests.service';
import { GetObjectivesPaginationService } from 'src/services/architecture/business/objectives.service';
import { GetAllListCompetenciesService } from 'src/services/architecture/business/competencies.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { ImageUploader } from 'src/components/image-uploader';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type Props = {
  currentTest?: IConfigureTest;
};

type OptionType = {
  value: string;
  label: string;
};


type ConfigureTestFormData = {
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  coverImage: string;
  objectiveScaleId: number | null;
};

// Competency option with color from GetAllListCompetenciesService
type ICompetencyOption = {
  id: number;
  name: string;
  color: string;
};

// Extended competence with UI state
type CompetenceItem = ITestCompetence & {
  _id: string;
  _expanded: boolean;
};

type ObjectiveItem = ITestObjective & {
  _id: string;
};

type QuestionItemInternal = ITestQuestion & {
  _id: string;
};

// DnD data type discriminators
const COMP_DND = '__comp';
const QUESTION_DND = '__question';
const OBJ_DND = '__obj';

function getCompDndData(id: string) {
  return { [COMP_DND]: true, id };
}
function isCompDndData(v: Record<string | symbol, unknown>): v is { [COMP_DND]: true; id: string } {
  return Boolean(v[COMP_DND]);
}
function getObjDndData(id: string) {
  return { [OBJ_DND]: true, id };
}
function isObjDndData(v: Record<string | symbol, unknown>): v is { [OBJ_DND]: true; id: string } {
  return Boolean(v[OBJ_DND]);
}
function getQuestionDndData(compId: string, qId: string) {
  return { [QUESTION_DND]: true, compId, qId };
}
function isQuestionDndData(
  v: Record<string | symbol, unknown>,
  compId: string
): v is { [QUESTION_DND]: true; compId: string; qId: string } {
  return Boolean(v[QUESTION_DND]) && (v as any).compId === compId;
}

// ----------------------------------------------------------------------
// Drop indicator line component
// ----------------------------------------------------------------------

function DropLine({ edge }: { edge: Edge | null }) {
  if (!edge || (edge !== 'top' && edge !== 'bottom')) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        bgcolor: 'primary.main',
        borderRadius: 1,
        zIndex: 10,
        ...(edge === 'top' ? { top: 0 } : { bottom: 0 }),
      }}
    />
  );
}

// ----------------------------------------------------------------------
// QuestionRow component with DnD
// ----------------------------------------------------------------------

type QuestionRowProps = {
  question: QuestionItemInternal;
  qIndex: number;
  compId: string;
  color: string;
  scales: IScale[];
  relationshipOptions: OptionType[];
  t: (key: string) => string;
  onUpdate: (qId: string, field: string, value: any) => void;
  onRemove: (qId: string) => void;
};

const QuestionRow = memo(function QuestionRow({
  question,
  qIndex,
  compId,
  color,
  scales,
  relationshipOptions,
  t,
  onUpdate,
  onRemove,
}: QuestionRowProps) {
  const theme = useTheme();
  const rowRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [overEdge, setOverEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const el = rowRef.current;
    const handle = handleRef.current;
    if (!el || !handle) return undefined;

    return combine(
      draggable({
        element: el,
        dragHandle: handle,
        getInitialData: () => getQuestionDndData(compId, question._id),
        onGenerateDragPreview: ({ nativeSetDragImage, location }) => {
          const sourceEl = rowRef.current;
          if (!sourceEl) return;
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({ element: sourceEl, input: location.current.input }),
            render({ container }) {
              const clone = sourceEl.cloneNode(true) as HTMLElement;
              clone.style.width = `${sourceEl.offsetWidth}px`;
              clone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              container.appendChild(clone);
              return () => {};
            },
          });
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => isQuestionDndData(source.data as any, compId) && (source.data as any).qId !== question._id,
        getData: ({ input }) =>
          attachClosestEdge(getQuestionDndData(compId, question._id), {
            element: el,
            input,
            allowedEdges: ['top', 'bottom'],
          }),
        onDrag: ({ self }) => setOverEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setOverEdge(null),
        onDrop: () => setOverEdge(null),
      })
    );
  }, [compId, question._id]);

  const scaleValue = scales.find((s) => Number(s.id) === Number(question.scaleId)) || null;
  const visibleForValue = relationshipOptions.filter((o) => question.visibleFor?.includes(o.value));

  return (
    <Box
      ref={rowRef}
      data-question-id={question._id}
      sx={{
        position: 'relative',
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
        p: 1.5,
        borderRadius: 1,
        bgcolor: alpha(theme.palette.grey[500], 0.04),
        border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <DropLine edge={overEdge} />

      {/* Drag handle */}
      <Tooltip title="Arrastrar para ordenar">
        <IconButton
          ref={handleRef}
          size="small"
          disableRipple
          sx={{ cursor: 'grab', mt: 0.5, flexShrink: 0, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
        >
          <Iconify icon="solar:hamburger-menu-bold-duotone" width={14} />
        </IconButton>
      </Tooltip>

      {/* Question number badge */}
      <Box
        sx={{
          minWidth: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>
          {qIndex + 1}
        </Typography>
      </Box>

      {/* Question fields */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          multiline
          rows={2}
          label={t('configure-tests.questionsModal.fields.description')}
          value={question.description}
          onChange={(e) => onUpdate(question._id, 'description', e.target.value)}
          placeholder={t('configure-tests.questionsModal.placeholders.description')}
        />

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Autocomplete
            sx={{ flex: 1, minWidth: 160 }}
            size="small"
            options={scales}
            value={scaleValue}
            onChange={(_, v) => onUpdate(question._id, 'scaleId', v ? Number(v.id) : 0)}
            getOptionLabel={(o) => o.name}
            renderInput={(params) => (
              <TextField {...params} label={t('configure-tests.questionsModal.fields.scale')} />
            )}
          />
          <TextField
            sx={{ width: 110 }}
            size="small"
            type="number"
            label={`${t('configure-tests.questionsModal.fields.weight')} (%)`}
            value={question.weight > 1 ? question.weight : (question.weight * 100) || ''}
            onChange={(e) => onUpdate(question._id, 'weight', Number(e.target.value))}
            inputProps={{ min: 0, max: 100, step: 1 }}
          />
        </Box>

        <Autocomplete
          multiple
          size="small"
          options={relationshipOptions}
          value={visibleForValue}
          onChange={(_, v) => onUpdate(question._id, 'visibleFor', v.map((o) => o.value))}
          getOptionLabel={(o) =>
            t(`configure-evaluations.relationships.${o.value}`) || o.value
          }
          renderInput={(params) => (
            <TextField {...params} label={t('configure-tests.questionsModal.fields.visibleFor')} size="small" />
          )}
        />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={Boolean(question.isOptional)}
              onChange={(e) => onUpdate(question._id, 'isOptional', e.target.checked)}
            />
          }
          label={
            <Typography variant="caption">
              {t('configure-tests.questionsModal.fields.isOptional')}
            </Typography>
          }
        />
      </Box>

      {/* Delete */}
      <Tooltip title="Eliminar pregunta">
        <IconButton size="small" color="error" onClick={() => onRemove(question._id)} sx={{ flexShrink: 0 }}>
          <Iconify icon="solar:trash-bin-trash-bold" width={14} />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

// ----------------------------------------------------------------------
// CompetenceCard component with DnD + inline editing
// ----------------------------------------------------------------------

type CompetenceCardProps = {
  comp: CompetenceItem;
  skills: ICompetencyOption[];
  skillsLoading: boolean;
  scales: IScale[];
  relationshipOptions: OptionType[];
  t: (key: string) => string;
  onUpdateSkill: (id: string, skill: ICompetencyOption) => void;
  onUpdateWeight: (id: string, weight: number) => void;
  onToggleExpand: (id: string) => void;
  onRemove: (id: string) => void;
  onAddQuestion: (compId: string) => void;
  onUpdateQuestion: (compId: string, qId: string, field: string, value: any) => void;
  onRemoveQuestion: (compId: string, qId: string) => void;
  onReorderQuestions: (compId: string, newOrder: any[]) => void;
  onSkillSearch: (search: string) => void;
};

const CompetenceCard = memo(function CompetenceCard({
  comp,
  skills,
  skillsLoading,
  scales,
  relationshipOptions,
  t,
  onUpdateSkill,
  onUpdateWeight,
  onToggleExpand,
  onRemove,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onReorderQuestions,
  onSkillSearch,
}: CompetenceCardProps) {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [overEdge, setOverEdge] = useState<Edge | null>(null);

  const color = comp.skillColor || theme.palette.primary.main;
  const colorRef = useRef(color);
  colorRef.current = color;
  const questions = useMemo(() => (comp.questions || []) as QuestionItemInternal[], [comp.questions]);

  // Competence-level DnD (handled by parent via monitorForElements)
  useEffect(() => {
    const el = cardRef.current;
    const handle = dragHandleRef.current;
    if (!el || !handle) return undefined;

    return combine(
      draggable({
        element: el,
        dragHandle: handle,
        getInitialData: () => getCompDndData(comp._id),
        onGenerateDragPreview: ({ nativeSetDragImage, location }) => {
          const sourceEl = cardRef.current;
          const headerEl = headerRef.current;
          if (!sourceEl || !headerEl) return;
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({ element: sourceEl, input: location.current.input }),
            render({ container }) {
              const wrapper = document.createElement('div');
              wrapper.style.cssText = [
                `width:${sourceEl.offsetWidth}px`,
                'border-radius:6px',
                'border:1px solid rgba(145,158,171,0.2)',
                `border-left:5px solid ${colorRef.current}`,
                'overflow:hidden',
                'background:white',
                'box-shadow:0 8px 24px rgba(0,0,0,0.12)',
              ].join(';');
              const headerClone = headerEl.cloneNode(true) as HTMLElement;
              wrapper.appendChild(headerClone);
              container.appendChild(wrapper);
              return () => {};
            },
          });
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => isCompDndData(source.data as any) && (source.data as any).id !== comp._id,
        getData: ({ input }) =>
          attachClosestEdge(getCompDndData(comp._id), {
            element: el,
            input,
            allowedEdges: ['top', 'bottom'],
          }),
        onDrag: ({ self }) => setOverEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setOverEdge(null),
        onDrop: () => setOverEdge(null),
      })
    );
  }, [comp._id]);

  // Question-level DnD monitor (scoped to this competence)
  useEffect(() => monitorForElements({
      canMonitor: ({ source }) => isQuestionDndData(source.data as any, comp._id),
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) return;
        const sourceQId = (source.data as any).qId as string;
        const targetQId = (target.data as any).qId as string;
        const sourceIndex = questions.findIndex((q) => q._id === sourceQId);
        const targetIndex = questions.findIndex((q) => q._id === targetQId);
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
        const edge = extractClosestEdge(target.data);
        const reordered = reorderWithEdge({
          axis: 'vertical',
          list: questions,
          startIndex: sourceIndex,
          indexOfTarget: targetIndex,
          closestEdgeOfTarget: edge,
        });
        onReorderQuestions(comp._id, reordered);
      },
    }), [comp._id, questions, onReorderQuestions]);

  // Build value for skill Autocomplete from stored data
  const skillValue: ICompetencyOption = {
    id: comp.competencyId,
    name: comp.competency?.name || comp.competenceName || '',
    color: comp.skillColor || '',
  };

  // Merge stored value into options so Autocomplete always finds it
  const skillOptions = skills.some((s) => s.id === skillValue.id)
    ? skills
    : [skillValue, ...skills];

  return (
    <Box
      ref={cardRef}
      data-comp-id={comp._id}
      sx={{
        position: 'relative',
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
        overflow: 'visible',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <DropLine edge={overEdge} />

      {/* Left color bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 5,
          bgcolor: color,
          borderRadius: '4px 0 0 4px',
        }}
      />

      {/* Card header — drag handle + inline skill selector + weight */}
      <Box
        ref={headerRef}
        sx={{
          pl: '20px',
          pr: 1.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: alpha(color, 0.04),
          borderRadius: `${alpha(color, 0.04) ? '0 6px 0 0' : '0'}`,
        }}
      >
        {/* Drag handle */}
        <Tooltip title="Arrastrar para ordenar">
          <IconButton
            ref={dragHandleRef}
            size="small"
            disableRipple
            sx={{
              cursor: 'grab',
              flexShrink: 0,
              color: 'text.disabled',
              '&:hover': { color: 'text.primary' },
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <Iconify icon="solar:hamburger-menu-bold-duotone" width={16} />
          </IconButton>
        </Tooltip>

        {/* Inline skill selector */}
        <Autocomplete
          sx={{ flex: 1, minWidth: 0 }}
          size="small"
          loading={skillsLoading}
          options={skillOptions}
          value={skillValue}
          onInputChange={(_, value, reason) => {
            if (reason === 'input') onSkillSearch(value);
          }}
          onChange={(_, v) => {
            if (v) onUpdateSkill(comp._id, v);
          }}
          getOptionLabel={(o) => o.name}
          filterOptions={(x) => x}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          getOptionKey={(o) => o.id}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <Box key={key} component="li" {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {option.color && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: option.color, flexShrink: 0 }} />}
                <Typography variant="body2">{option.name}</Typography>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Competencia"
              size="small"
              variant="standard"
              sx={{ '& .MuiInput-underline:before': { borderColor: alpha(color, 0.3) } }}
            />
          )}
          disableClearable
        />

        {/* Inline weight input */}
        <TextField
          size="small"
          type="number"
          label="Peso %"
          value={comp.weight}
          onChange={(e) => onUpdateWeight(comp._id, Number(e.target.value))}
          variant="standard"
          inputProps={{ min: 1, max: 100, step: 1 }}
          sx={{ width: 70, flexShrink: 0 }}
        />

        {/* Expand / collapse */}
        <IconButton size="small" onClick={() => onToggleExpand(comp._id)}>
          <Iconify
            icon={comp._expanded ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
            width={16}
            sx={{ color }}
          />
        </IconButton>

        {/* Delete */}
        <Tooltip title="Eliminar competencia">
          <IconButton size="small" color="error" onClick={() => onRemove(comp._id)}>
            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Questions section */}
      <Collapse in={comp._expanded}>
        <Box sx={{ pl: '20px', pr: 1.5, pb: 1.5 }}>
          {questions.length > 0 ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {questions.map((q, qIdx) => (
                <QuestionRow
                  key={q._id}
                  question={q}
                  qIndex={qIdx}
                  compId={comp._id}
                  color={color}
                  scales={scales}
                  relationshipOptions={relationshipOptions}
                  t={t}
                  onUpdate={(qId, field, value) => onUpdateQuestion(comp._id, qId, field, value)}
                  onRemove={(qId) => onRemoveQuestion(comp._id, qId)}
                />
              ))}
            </Stack>
          ) : (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', py: 1.5, textAlign: 'center' }}
            >
              Sin preguntas — agrega una a continuación
            </Typography>
          )}

          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => onAddQuestion(comp._id)}
            sx={{ mt: 1.5 }}
          >
            Agregar pregunta
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
});

// ----------------------------------------------------------------------
// ObjectiveCard component
// ----------------------------------------------------------------------

type ObjectiveCardProps = {
  obj: ObjectiveItem;
  objectivesList: IObjective[];
  objectivesLoading: boolean;
  t: (key: string) => string;
  onUpdateObjective: (id: string, objective: IObjective) => void;
  onUpdateWeight: (id: string, weight: number) => void;
  onUpdateTargetValue: (id: string, targetValue: number) => void;
  onUpdateCustomKpi: (id: string, customKpi: string) => void;
  onObjectiveSearch: (search: string) => void;
  onRemove: (id: string) => void;
};

const ObjectiveCard = memo(function ObjectiveCard({
  obj,
  objectivesList,
  objectivesLoading,
  t,
  onUpdateObjective,
  onUpdateWeight,
  onUpdateTargetValue,
  onUpdateCustomKpi,
  onObjectiveSearch,
  onRemove,
}: ObjectiveCardProps) {
  const theme = useTheme();
  const color = theme.palette.warning.main;
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [overEdge, setOverEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    const handle = dragHandleRef.current;
    if (!el || !handle) return undefined;

    return combine(
      draggable({
        element: el,
        dragHandle: handle,
        getInitialData: () => getObjDndData(obj._id),
        onGenerateDragPreview: ({ nativeSetDragImage, location }) => {
          const sourceEl = cardRef.current;
          if (!sourceEl) return;
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({ element: sourceEl, input: location.current.input }),
            render({ container }) {
              const clone = sourceEl.cloneNode(true) as HTMLElement;
              clone.style.width = `${sourceEl.offsetWidth}px`;
              clone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              container.appendChild(clone);
              return () => {};
            },
          });
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => isObjDndData(source.data as any) && (source.data as any).id !== obj._id,
        getData: ({ input }) =>
          attachClosestEdge(getObjDndData(obj._id), {
            element: el,
            input,
            allowedEdges: ['top', 'bottom'],
          }),
        onDrag: ({ self }) => setOverEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setOverEdge(null),
        onDrop: () => setOverEdge(null),
      })
    );
  }, [obj._id]);

  const objectiveValue = { id: obj.objectiveId, name: obj.objective?.name || obj.objectiveName || '' } as IObjective;
  const objectiveOptions = objectivesList.some((o) => o.id === objectiveValue.id)
    ? objectivesList
    : [objectiveValue, ...objectivesList];

  return (
    <Box
      ref={cardRef}
      data-obj-id={obj._id}
      sx={{
        position: 'relative',
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
        overflow: 'visible',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <DropLine edge={overEdge} />

      {/* Left color bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 5,
          bgcolor: color,
          borderRadius: '4px 0 0 4px',
        }}
      />

      {/* Card row */}
      <Box
        sx={{
          pl: '20px',
          pr: 1.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: alpha(color, 0.04),
          borderRadius: 1.5,
        }}
      >
        {/* Drag handle */}
        <Tooltip title="Arrastrar para ordenar">
          <IconButton
            ref={dragHandleRef}
            size="small"
            disableRipple
            sx={{
              cursor: 'grab',
              flexShrink: 0,
              color: 'text.disabled',
              '&:hover': { color: 'text.primary' },
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <Iconify icon="solar:hamburger-menu-bold-duotone" width={16} />
          </IconButton>
        </Tooltip>

        {/* Inline objective selector */}
        <Autocomplete
          sx={{ flex: 1, minWidth: 0 }}
          size="small"
          loading={objectivesLoading}
          options={objectiveOptions}
          value={objectiveValue}
          onInputChange={(_, value, reason) => {
            if (reason === 'input') onObjectiveSearch(value);
          }}
          onChange={(_, v) => {
            if (v) onUpdateObjective(obj._id, v);
          }}
          getOptionLabel={(o) => o.name}
          filterOptions={(x) => x}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={String(option.id)}>
              <Typography variant="body2">{option.name}</Typography>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Objetivo"
              size="small"
              variant="standard"
              sx={{ '& .MuiInput-underline:before': { borderColor: alpha(color, 0.3) } }}
            />
          )}
          disableClearable
        />

        {/* Weight */}
        <TextField
          size="small"
          type="number"
          label={`${t('configure-tests.form.fields.weight')} %`}
          value={obj.weight}
          onChange={(e) => onUpdateWeight(obj._id, Number(e.target.value))}
          variant="standard"
          inputProps={{ min: 0, max: 100, step: 1 }}
          sx={{ width: 70, flexShrink: 0 }}
        />

        {/* Target value */}
        <TextField
          size="small"
          type="number"
          label={t('configure-tests.form.fields.target')}
          value={obj.targetValue}
          onChange={(e) => onUpdateTargetValue(obj._id, Number(e.target.value))}
          variant="standard"
          inputProps={{ min: 0, step: 1 }}
          sx={{ width: 80, flexShrink: 0 }}
        />

        {/* Custom KPI */}
        <TextField
          size="small"
          label="KPI"
          value={obj.customKpi}
          onChange={(e) => onUpdateCustomKpi(obj._id, e.target.value)}
          variant="standard"
          sx={{ width: 120, flexShrink: 0 }}
        />

        {/* Delete */}
        <Tooltip title="Eliminar objetivo">
          <IconButton size="small" color="error" onClick={() => onRemove(obj._id)}>
            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});

// ----------------------------------------------------------------------
// Main form component
// ----------------------------------------------------------------------

export function ConfigureTestsCreateEditForm({ currentTest }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslate('performance');

  const [scales, setScales] = useState<IScale[]>([]);
  const [evaluationTypes, setEvaluationTypes] = useState<OptionType[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<OptionType[]>([]);
  const [, setLoading] = useState(true);

  // Shared skills state (used by add-panel + in-card selectors)
  const [skills, setSkills] = useState<ICompetencyOption[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [competences, setCompetences] = useState<CompetenceItem[]>([]);
  const [objectives, setObjectives] = useState<ObjectiveItem[]>([]);
  const [selectedObjectiveScale, setSelectedObjectiveScale] = useState<any>(null);

  // Competences add-panel state
  const [selectedSkill, setSelectedSkill] = useState<ICompetencyOption | null>(null);
  const [newCompetenceWeight, setNewCompetenceWeight] = useState('');
  const [addSkillSearch, setAddSkillSearch] = useState('');

  // Objectives add-panel state
  const [objectivesList, setObjectivesList] = useState<IObjective[]>([]);
  const [objectivesLoading, setObjectivesLoading] = useState(false);
  const objectivesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<IObjective | null>(null);
  const [newObjWeight, setNewObjWeight] = useState('');
  const [newObjTargetValue, setNewObjTargetValue] = useState('');
  const [newObjCustomKpi, setNewObjCustomKpi] = useState('');
  const [addObjectiveSearch, setAddObjectiveSearch] = useState('');

  // Refs for DnD monitors
  const competencesRef = useRef(competences);
  competencesRef.current = competences;
  const objectivesRef = useRef(objectives);
  objectivesRef.current = objectives;

  // ----------------------------------------------------------------------

  const ConfigureTestSchema = z.object({
    name: z.string().trim().min(1, { message: t('configure-tests.form.validation.nameRequired') }),
    type: z.string().trim().min(1, { message: t('configure-tests.form.validation.typeRequired') }),
    description: z.string(),
    isActive: z.boolean(),
    coverImage: z.string(),
    objectiveScaleId: z.number().nullable(),
  });

  const defaultValues: ConfigureTestFormData = {
    name: currentTest?.name || '',
    description: currentTest?.description || '',
    type: currentTest?.type || '',
    isActive: currentTest?.isActive ?? true,
    coverImage: currentTest?.coverImage || '',
    objectiveScaleId: currentTest?.objectiveScaleId ? Number(currentTest.objectiveScaleId) : null,
  };

  const methods = useForm<ConfigureTestFormData>({
    mode: 'onSubmit',
    resolver: zodResolver(ConfigureTestSchema),
    defaultValues,
  });

  const { handleSubmit, watch, setValue, control, formState: { isSubmitting } } = methods;
  const watchType = watch('type');

  // ----------------------------------------------------------------------
  const translateType = useCallback(
    (type: string) => t(`configure-evaluations.types.${type}`),
    [t]
  );

  // Skills loading
  // ----------------------------------------------------------------------
  const loadSkills = useCallback(async (search: string = '') => {
    setSkillsLoading(true);
    try {
      const response = await GetAllListCompetenciesService();
      if (Array.isArray(response?.data?.data)) {
        setSkills(response.data.data);
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  const handleSkillSearch = useCallback(
    (search: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => loadSkills(search), 300);
    },
    [loadSkills]
  );

  const loadObjectives = useCallback(async (search: string = '') => {
    setObjectivesLoading(true);
    try {
      const response = await GetObjectivesPaginationService({ page: 1, perPage: 10, search: search || undefined });
      if (response?.data && Array.isArray(response.data[0])) {
        setObjectivesList(response.data[0]);
      } else if (Array.isArray(response?.data)) {
        setObjectivesList(response.data as IObjective[]);
      }
    } catch (error) {
      console.error('Error loading objectives:', error);
    } finally {
      setObjectivesLoading(false);
    }
  }, []);

  const handleObjectiveSearch = useCallback(
    (search: string) => {
      if (objectivesDebounceRef.current) clearTimeout(objectivesDebounceRef.current);
      objectivesDebounceRef.current = setTimeout(() => loadObjectives(search), 300);
    },
    [loadObjectives]
  );

  // ----------------------------------------------------------------------
  // Initial data load
  // ----------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [relatedRes, scalesRes] = await Promise.all([
          GetPerformanceRelatedDataService({}),
          GetScalesPaginationService({ page: 1, perPage: 100 }),
        ]);
        if (relatedRes.data?.statusCode === 200 && relatedRes.data?.data) {
          setEvaluationTypes(relatedRes.data.data.evaluationTypes || []);
          setRelationshipOptions(relatedRes.data.data.evaluationRelationships || []);
        }
        if (scalesRes?.data && Array.isArray(scalesRes.data)) {
          setScales(scalesRes.data);
        }
        await loadSkills();
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error(t('configure-tests.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadSkills, t]);

  // Preload edit data
  useEffect(() => {
    if (!currentTest) return;
    if (currentTest.objectiveScale) {
      setSelectedObjectiveScale({ id: currentTest.objectiveScale.id, name: currentTest.objectiveScale.name });
    }
    if (currentTest.competences) {
      setCompetences(
        currentTest.competences.map((comp) => ({
          ...comp,
          skillColor: comp.skillColor || (comp.competency as any)?.color || '',
          _id: crypto.randomUUID(),
          _expanded: false,
          questions: (comp.questions || []).map((q) => ({
            ...q,
            _id: (q as any)._id || crypto.randomUUID(),
          })),
        }))
      );
    }
    if (currentTest.objectives) {
      setObjectives(currentTest.objectives.map((obj) => ({ ...obj, _id: crypto.randomUUID() })));
    }
  }, [currentTest]);

  // Load objectives list when type is OBJECTIVES
  useEffect(() => {
    if (watchType === 'OBJECTIVES') {
      loadObjectives();
    }
  }, [watchType, loadObjectives]);

  // ----------------------------------------------------------------------
  // Competence DnD monitor (at container level)
  // ----------------------------------------------------------------------
  useEffect(() => monitorForElements({
      canMonitor: ({ source }) => isCompDndData(source.data as any),
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) return;
        const sourceId = (source.data as any).id as string;
        const targetId = (target.data as any).id as string;
        const list = competencesRef.current;
        const sourceIndex = list.findIndex((c) => c._id === sourceId);
        const targetIndex = list.findIndex((c) => c._id === targetId);
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
        const edge = extractClosestEdge(target.data);
        const reordered = reorderWithEdge({
          axis: 'vertical',
          list,
          startIndex: sourceIndex,
          indexOfTarget: targetIndex,
          closestEdgeOfTarget: edge,
        });
        setCompetences(reordered);
      },
    }), []);

  // ----------------------------------------------------------------------
  // Objectives DnD monitor (at container level)
  // ----------------------------------------------------------------------
  useEffect(() => monitorForElements({
      canMonitor: ({ source }) => isObjDndData(source.data as any),
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) return;
        const sourceId = (source.data as any).id as string;
        const targetId = (target.data as any).id as string;
        const list = objectivesRef.current;
        const sourceIndex = list.findIndex((o) => o._id === sourceId);
        const targetIndex = list.findIndex((o) => o._id === targetId);
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
        const edge = extractClosestEdge(target.data);
        const reordered = reorderWithEdge({
          axis: 'vertical',
          list,
          startIndex: sourceIndex,
          indexOfTarget: targetIndex,
          closestEdgeOfTarget: edge,
        });
        setObjectives(reordered);
      },
    }), []);

  // ----------------------------------------------------------------------
  // Competences handlers
  // ----------------------------------------------------------------------
  const handleAddCompetence = () => {
    if (!selectedSkill || !newCompetenceWeight || Number(newCompetenceWeight) <= 0) return;
    if (competences.some((c) => c.competencyId === Number(selectedSkill.id))) {
      toast.warning('Esta competencia ya fue agregada');
      return;
    }
    setCompetences((prev) => [
      ...prev,
      {
        competencyId: Number(selectedSkill.id),
        competenceName: selectedSkill.name,
        skillColor: selectedSkill.color,
        weight: Number(newCompetenceWeight),
        questions: [],
        _id: crypto.randomUUID(),
        _expanded: true,
      },
    ]);
    setSelectedSkill(null);
    setNewCompetenceWeight('');
    setAddSkillSearch('');
    loadSkills();
  };

  const handleUpdateCompetenceSkill = useCallback((id: string, skill: ICompetencyOption) => {
    setCompetences((prev) =>
      prev.map((c) =>
        c._id === id
          ? { ...c, competencyId: Number(skill.id), competenceName: skill.name, skillColor: skill.color, competency: { id: Number(skill.id), name: skill.name } }
          : c
      )
    );
  }, []);

  const handleUpdateCompetenceWeight = useCallback((id: string, weight: number) => {
    setCompetences((prev) => prev.map((c) => (c._id === id ? { ...c, weight } : c)));
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setCompetences((prev) => prev.map((c) => (c._id === id ? { ...c, _expanded: !c._expanded } : c)));
  }, []);

  const handleRemoveCompetence = useCallback((id: string) => {
    setCompetences((prev) => prev.filter((c) => c._id !== id));
  }, []);

  // ----------------------------------------------------------------------
  // Questions handlers
  // ----------------------------------------------------------------------
  const handleAddQuestion = useCallback((compId: string) => {
    setCompetences((prev) =>
      prev.map((c) => {
        if (c._id !== compId) return c;
        const newQ: QuestionItemInternal = {
          _id: crypto.randomUUID(),
          description: '',
          scaleId: 0,
          weight: 100,
          isOptional: false,
          order: (c.questions?.length || 0) + 1,
          visibleFor: [],
        };
        return { ...c, questions: [...(c.questions || []), newQ] };
      })
    );
  }, []);

  const handleUpdateQuestion = useCallback((compId: string, qId: string, field: string, value: any) => {
    setCompetences((prev) =>
      prev.map((c) => {
        if (c._id !== compId) return c;
        return {
          ...c,
          questions: (c.questions || []).map((q: any) => (q._id === qId ? { ...q, [field]: value } : q)),
        };
      })
    );
  }, []);

  const handleRemoveQuestion = useCallback((compId: string, qId: string) => {
    setCompetences((prev) =>
      prev.map((c) => {
        if (c._id !== compId) return c;
        return { ...c, questions: (c.questions || []).filter((q: any) => q._id !== qId) };
      })
    );
  }, []);

  const handleReorderQuestions = useCallback((compId: string, newOrder: any[]) => {
    setCompetences((prev) => prev.map((c) => (c._id === compId ? { ...c, questions: newOrder } : c)));
  }, []);

  // Objectives handlers
  const handleAddObjective = () => {
    if (!selectedObjective || !newObjWeight || Number(newObjWeight) <= 0) return;
    if (objectives.some((o) => o.objectiveId === selectedObjective.id)) {
      toast.warning('Este objetivo ya fue agregado');
      return;
    }
    setObjectives((prev) => [
      ...prev,
      {
        _id: crypto.randomUUID(),
        objectiveId: selectedObjective.id,
        objectiveName: selectedObjective.name,
        weight: Number(newObjWeight),
        targetValue: Number(newObjTargetValue) || 0,
        customKpi: newObjCustomKpi,
      },
    ]);
    setSelectedObjective(null);
    setNewObjWeight('');
    setNewObjTargetValue('');
    setNewObjCustomKpi('');
    setAddObjectiveSearch('');
    loadObjectives();
  };

  const handleRemoveObjective = (id: string) => {
    setObjectives((prev) => prev.filter((o) => o._id !== id));
  };

  const handleUpdateObjective = useCallback((id: string, objective: IObjective) => {
    setObjectives((prev) =>
      prev.map((o) => (o._id === id ? { ...o, objectiveId: objective.id, objectiveName: objective.name } : o))
    );
  }, []);

  const handleUpdateObjectiveWeight = useCallback((id: string, weight: number) => {
    setObjectives((prev) => prev.map((o) => (o._id === id ? { ...o, weight } : o)));
  }, []);

  const handleUpdateObjectiveTargetValue = useCallback((id: string, targetValue: number) => {
    setObjectives((prev) => prev.map((o) => (o._id === id ? { ...o, targetValue } : o)));
  }, []);

  const handleUpdateObjectiveCustomKpi = useCallback((id: string, customKpi: string) => {
    setObjectives((prev) => prev.map((o) => (o._id === id ? { ...o, customKpi } : o)));
  }, []);

  // ----------------------------------------------------------------------
  // Submit
  // ----------------------------------------------------------------------
  const onSubmit = handleSubmit(async (data) => {
    const testId = currentTest?.id;
    try {
      const normalizeWeight = (w: unknown) => {
        const v = Number(w ?? 0);
        if (!Number.isFinite(v)) return 0;
        return v > 1 ? v / 100 : v;
      };
      const payload = {
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: data.isActive,
        coverImage: data.coverImage || null,
        objectiveScaleId: selectedObjectiveScale?.id ? Number(selectedObjectiveScale.id) : null,
        competences: competences.map((comp) => ({
          competencyId: Number(comp.competencyId),
          weight: Number(comp.weight),
          questions: (comp.questions || []).map((question: any, idx: number) => ({
            description: question?.description || '',
            scaleId: Number(question?.scaleId),
            weight: normalizeWeight(question?.weight),
            isOptional: Boolean(question?.isOptional),
            order: idx + 1,
            visibleFor: Array.isArray(question?.visibleFor) ? question.visibleFor : [],
          })),
        })),
        objectives: objectives.map((obj) => ({
          objectiveId: obj.objectiveId,
          weight: obj.weight,
          targetValue: obj.targetValue,
          customKpi: obj.customKpi,
        })),
      };
      await SaveOrUpdateConfigureTestsService(payload, testId);
      toast.success(testId ? t('configure-tests.messages.success.updated') : t('configure-tests.messages.success.created'));
      router.push(paths.dashboard.performance.configureTests);
    } catch (error: any) {
      toast.error(testId ? t(error?.message || 'configure-tests.messages.error.update') : t(error?.message || 'configure-tests.messages.error.create'));
    }
  });

  // ----------------------------------------------------------------------
  return (
    <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          {/* Card 1: General info */}
          <Card>
            <CardHeader
              title={t('configure-tests.form.sections.generalInfo') || 'Información general'}
              sx={{ pb: 0 }}
            />
            <Box sx={{ p: 3 }}>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
                <Field.Text
                  name="name"
                  label={t('configure-tests.form.fields.name')}
                  placeholder={t('configure-tests.form.placeholders.name')}
                  required
                />
                <Field.Select
                  name="type"
                  label={t('configure-tests.form.fields.type')}
                  placeholder={t('configure-tests.form.placeholders.type')}
                  required
                >
                  {evaluationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {translateType(type.value)}
                    </MenuItem>
                  ))}
                </Field.Select>

                <Field.Text
                  name="description"
                  label={t('configure-tests.form.fields.description')}
                  placeholder={t('configure-tests.form.placeholders.description')}
                  multiline
                  rows={9}
                />

                <Box sx={{ position: 'relative' }}>
                  {/* Always-visible badge label */}
                  <Chip
                    size="small"
                    label={t('configure-tests.form.fields.coverImage')}
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      zIndex: 2,
                      pointerEvents: 'none',
                      bgcolor: 'background.paper',
                      border: (th) => `1px solid ${th.palette.divider}`,
                      color: 'text.secondary',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                      height: 32,
                      '& .MuiChip-label': { px: 1.5 },
                    }}
                  />
                  <ImageUploader
                    imageUrl={watch('coverImage')}
                    height={260}
                    placeholderText={t('configure-tests.form.placeholders.coverImage', 'Sube la imagen de portada')}
                    onUploadSuccess={(url) => setValue('coverImage', url, { shouldValidate: true })}
                    onDeleteSuccess={() => setValue('coverImage', '', { shouldValidate: true })}
                  />
                </Box>

                <Box
                  sx={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    p: 2.5,
                    borderRadius: 1.5,
                    border: (th) => `1px solid ${alpha(th.palette.grey[500], 0.2)}`,
                    bgcolor: (th) => alpha(th.palette.grey[500], 0.04),
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2">
                      {t('configure-tests.form.fields.isActive')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('configure-tests.form.descriptions.isActive')}
                    </Typography>
                  </Stack>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={Boolean(field.value)} onChange={field.onChange} />
                    )}
                  />
                </Box>

                {watchType === 'OBJECTIVES' && (
                  <Box sx={{ gridColumn: 'span 2' }}>
                    <Autocomplete
                      fullWidth
                      options={scales}
                      getOptionLabel={(o) => o.name || ''}
                      value={selectedObjectiveScale}
                      onChange={(_, v) => setSelectedObjectiveScale(v)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('configure-tests.form.fields.objectiveScale')}
                          placeholder={t('configure-tests.form.placeholders.objectiveScale')}
                        />
                      )}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Card>

          {/* Gate: sin tipo seleccionado */}
          {!watchType && (
            <Card>
              <Box
                sx={{
                  py: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  color: 'text.disabled',
                }}
              >
                <Iconify icon="solar:lock-bold-duotone" width={48} sx={{ opacity: 0.4 }} />
                <Typography variant="body2">
                  {t('configure-tests.form.messages.selectTypeFirst')}
                </Typography>
              </Box>
            </Card>
          )}

          {/* Card 2: Competencias y Preguntas — solo cuando hay tipo y NO es OBJECTIVES */}
          {watchType && watchType !== 'OBJECTIVES' && <Card>
              <CardHeader
                title={t('configure-tests.form.sections.competencesAndQuestions') || 'Competencias y preguntas'}
                sx={{ pb: 0 }}
              />
              <Box sx={{ p: 3 }}>
                {/* Add competence panel */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-end',
                    mb: 3,
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.grey[500], 0.04),
                    border: `1px dashed ${alpha(theme.palette.grey[500], 0.24)}`,
                  }}
                >
                  <Autocomplete
                    sx={{ flex: 1 }}
                    loading={skillsLoading}
                    options={skills}
                    value={selectedSkill}
                    inputValue={addSkillSearch}
                    onInputChange={(_, value, reason) => {
                      setAddSkillSearch(value);
                      if (reason === 'input') handleSkillSearch(value);
                    }}
                    onChange={(_, v) => setSelectedSkill(v)}
                    getOptionLabel={(o) => o.name}
                    filterOptions={(x) => x}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    getOptionKey={(o) => o.id}
                    renderOption={(props, option) => {
                      const { key, ...rest } = props;
                      return (
                        <Box key={key} component="li" {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {option.color && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: option.color, flexShrink: 0 }} />}
                          <Typography variant="body2">{option.name}</Typography>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Seleccionar competencia" placeholder="Buscar..." size="small" />
                    )}
                  />
                  <TextField
                    sx={{ width: 120 }}
                    size="small"
                    type="number"
                    label="Peso (%)"
                    value={newCompetenceWeight}
                    onChange={(e) => setNewCompetenceWeight(e.target.value)}
                    inputProps={{ min: 1, max: 100, step: 1 }}
                  />
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={handleAddCompetence}
                    disabled={!selectedSkill || !newCompetenceWeight || Number(newCompetenceWeight) <= 0}
                    sx={{ flexShrink: 0 }}
                  >
                    Agregar
                  </Button>
                </Box>

                {/* Competences list */}
                {competences.length > 0 ? (
                  <Stack spacing={1.5}>
                    {competences.map((comp) => (
                      <CompetenceCard
                        key={comp._id}
                        comp={comp}
                        skills={skills}
                        skillsLoading={skillsLoading}
                        scales={scales}
                        relationshipOptions={relationshipOptions}
                        t={t}
                        onUpdateSkill={handleUpdateCompetenceSkill}
                        onUpdateWeight={handleUpdateCompetenceWeight}
                        onToggleExpand={handleToggleExpand}
                        onRemove={handleRemoveCompetence}
                        onAddQuestion={handleAddQuestion}
                        onUpdateQuestion={handleUpdateQuestion}
                        onRemoveQuestion={handleRemoveQuestion}
                        onReorderQuestions={handleReorderQuestions}
                        onSkillSearch={handleSkillSearch}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ py: 5, textAlign: 'center', color: 'text.disabled' }}>
                    <Iconify icon="solar:cup-star-bold" width={48} sx={{ mb: 1, opacity: 0.4 }} />
                    <Typography variant="body2">{t('configure-tests.form.messages.noCompetences')}</Typography>
                  </Box>
                )}
              </Box>
            </Card>}

          {/* Card 3: Objectives */}
          {watchType === 'OBJECTIVES' && (
            <Card>
              <CardHeader
                title={t('configure-tests.form.fields.objectives') || 'Objetivos'}
                sx={{ pb: 0 }}
              />
              <Box sx={{ p: 3 }}>
                {/* Add objective panel */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    mb: 3,
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.grey[500], 0.04),
                    border: `1px dashed ${alpha(theme.palette.grey[500], 0.24)}`,
                  }}
                >
                  <Autocomplete
                    sx={{ flex: 1, minWidth: 200 }}
                    loading={objectivesLoading}
                    options={objectivesList}
                    value={selectedObjective}
                    inputValue={addObjectiveSearch}
                    onInputChange={(_, value, reason) => {
                      setAddObjectiveSearch(value);
                      if (reason === 'input') handleObjectiveSearch(value);
                    }}
                    onOpen={() => { if (!objectivesList.length) loadObjectives(); }}
                    onChange={(_, v) => setSelectedObjective(v)}
                    getOptionLabel={(o) => o.name}
                    filterOptions={(x) => x}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={String(option.id)}>
                        <Typography variant="body2">{option.name}</Typography>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Seleccionar objetivo" placeholder="Buscar..." size="small" />
                    )}
                  />
                  <TextField
                    sx={{ width: 100 }}
                    size="small"
                    type="number"
                    label={`${t('configure-tests.form.fields.weight')} (%)`}
                    value={newObjWeight}
                    onChange={(e) => setNewObjWeight(e.target.value)}
                    inputProps={{ min: 1, max: 100, step: 1 }}
                  />
                  <TextField
                    sx={{ width: 110 }}
                    size="small"
                    type="number"
                    label={t('configure-tests.form.fields.target')}
                    value={newObjTargetValue}
                    onChange={(e) => setNewObjTargetValue(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <TextField
                    sx={{ width: 140 }}
                    size="small"
                    label="KPI"
                    value={newObjCustomKpi}
                    onChange={(e) => setNewObjCustomKpi(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={handleAddObjective}
                    disabled={!selectedObjective || !newObjWeight || Number(newObjWeight) <= 0}
                    sx={{ flexShrink: 0 }}
                  >
                    Agregar
                  </Button>
                </Box>

                {/* Objectives list */}
                {objectives.length > 0 ? (
                  <Stack spacing={1.5}>
                    {objectives.map((obj) => (
                      <ObjectiveCard
                        key={obj._id}
                        obj={obj}
                        objectivesList={objectivesList}
                        objectivesLoading={objectivesLoading}
                        t={t}
                        onUpdateObjective={handleUpdateObjective}
                        onUpdateWeight={handleUpdateObjectiveWeight}
                        onUpdateTargetValue={handleUpdateObjectiveTargetValue}
                        onUpdateCustomKpi={handleUpdateObjectiveCustomKpi}
                        onObjectiveSearch={handleObjectiveSearch}
                        onRemove={handleRemoveObjective}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ py: 5, textAlign: 'center', color: 'text.disabled' }}>
                    <Iconify icon="solar:flag-bold" width={48} sx={{ mb: 1, opacity: 0.4 }} />
                    <Typography variant="body2">{t('configure-tests.form.messages.noObjectives') || 'Sin objetivos agregados'}</Typography>
                  </Box>
                )}
              </Box>
            </Card>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => router.push(paths.dashboard.performance.configureTests)}>
              {t('configure-tests.actions.cancel')}
            </Button>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {currentTest ? t('configure-tests.actions.update') : t('configure-tests.actions.save')}
            </Button>
          </Stack>
        </Stack>
      </Form>
  );
}
