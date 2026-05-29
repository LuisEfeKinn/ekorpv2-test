import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type DocumentMapNode = {
  id: string | number;
  relationId?: string | number;
  label: string;
  data?: unknown;
  children?: DocumentMapNode[];
};

type DocumentMapResponse = {
  id: string | number;
  label: string;
  data?: unknown;
  children: DocumentMapNode[];
};

const parseNumber = (value: string | null): number | null => {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export async function GET(_req: NextRequest, context: { params: Promise<{ documentId: string; nodeId: string }> }) {
  const { documentId, nodeId } = await context.params;
  const documentNumericId = parseNumber(documentId) ?? documentId;

  if (nodeId === 'pro') {
    const response: DocumentMapResponse = {
      id: 'pro',
      label: 'Procesos',
      children: [
        {
          id: 9,
          relationId: 9,
          label: 'PROC-101 - NOMBRE_DE_EJEMPLO 2',
          data: {
            createdBy: null,
            createdDate: '2026-04-24T01:48:43.245Z',
            lastModifiedBy: null,
            lastModifiedDate: '2026-04-24T01:48:43.245Z',
            id: 9,
            observations: 'jhdsa',
            process: {
              createdBy: null,
              createdDate: '2026-03-28T01:19:12.459Z',
              lastModifiedBy: null,
              lastModifiedDate: '2026-03-28T01:19:12.459Z',
              id: 66,
              nomenclature: 'PROC-101',
              name: 'NOMBRE_DE_EJEMPLO 2',
              description: '',
              result: '-',
              requiresOLA: true,
              periodicity: 0,
              workload: 0,
              cost: 0,
              context: null,
              status: null,
              startDate: null,
              endDate: null,
              scheduleTask: null,
              projectStatus: null,
              creationDate: null,
              modificationDate: null,
              taskType: null,
              taskDeadline: null,
              taskStartDate: null,
              taskUpdateDate: null,
              fulfillmentAction: null,
              reminder: null,
              sistemRequirement: null,
            },
            document: {
              createdBy: null,
              createdDate: '2026-04-23T22:10:21.430Z',
              lastModifiedBy: null,
              lastModifiedDate: '2026-04-23T22:10:21.430Z',
              id: documentNumericId,
              code: 'fds',
              name: 'dfs',
              description: 'psd',
              version: 1,
              writingDate: '2026-04-22',
              expirationDate: '2026-04-29',
              modificationDate: null,
              file: 'https://clarity-kinn.s3.us-east-1.amazonaws.com/Documents/users_clarity-5.xlsx',
              type: 'ds',
              link: 'asd',
              originalFile: null,
              ranking: null,
              active: null,
            },
          },
        },
      ],
    };

    return NextResponse.json(response);
  }

  const fallback: DocumentMapResponse = {
    id: nodeId,
    label: String(nodeId),
    children: [],
  };

  return NextResponse.json(fallback);
}

