import axios, { endpoints } from 'src/utils/axios';

export type SystemIndicatorRelation = {
  id: number;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  creationDate?: string | null;
  observations?: string | null;
  system?: {
    id: number;
    name?: string;
    description?: string;
    architecture?: boolean;
    sla?: boolean;
    nomenclature?: string;
    code?: string | null;
    contractedCapacity?: string | null;
    adoptionContractDate?: string | null;
    expirationDate?: string | null;
    renewalDate?: string | null;
    contract?: string | null;
    obsolescenceDate?: string | null;
    requiresSla?: boolean;
    hasSla?: boolean;
    localExternal?: string | null;
    impactRatio?: string | null;
    impactLevel?: number | null;
  } | null;
  indicator?: {
    id: number;
    indicatorName?: string;
    name?: string;
    indicatorDescription?: string;
    indicatorFrequency?: string | null;
    indicatorCode?: string | null;
    measurementUnit?: string | null;
    targetValue?: number | null;
    creationDate?: string | null;
    modificationDate?: string | null;
    status?: number | null;
    achievedValue?: number | null;
    valueType?: number | null;
    graphType?: number | null;
    requiresEvidence?: string | null;
    trendChangeDate?: string | null;
    evaluationStartDate?: string | null;
    evaluationEndDate?: string | null;
    expectedTendence?: number | null;
    favorability?: number | null;
    allowsSelfEvaluation?: string | null;
    type?: number | null;
  } | null;
  systemId?: number;
  indicatorId?: number;
  indicator_id?: number;
};

export type SaveSystemIndicatorRelationPayload = {
  observations?: string;
  system: { id: number };
  indicator: { id: number };
};

export const GetSystemIndicatorRelationsService = async () =>
  axios.get<SystemIndicatorRelation[]>(endpoints.architecture.indicators.systemIndicators);

export const GetSystemIndicatorRelationByIdService = async (id: number | string) =>
  axios.get<SystemIndicatorRelation>(`${endpoints.architecture.indicators.systemIndicators}/${id}`);

export const SaveSystemIndicatorRelationService = async (payload: SaveSystemIndicatorRelationPayload) =>
  axios.post(endpoints.architecture.indicators.systemIndicators, payload);

export const UpdateSystemIndicatorRelationService = async (
  id: number | string,
  payload: SaveSystemIndicatorRelationPayload
) => axios.patch(`${endpoints.architecture.indicators.systemIndicators}/${id}`, payload);

export const DeleteSystemIndicatorRelationService = async (id: number | string) =>
  axios.delete(`${endpoints.architecture.indicators.systemIndicators}/${id}`);
