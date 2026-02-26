import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const data = [
    [
      {
        "createdBy": null,
        "createdDate": "2025-11-07T00:44:26.557Z",
        "lastModifiedBy": null,
        "lastModifiedDate": "2025-11-19T21:20:54.000Z",
        "id": 1,
        "typeCode": "ORC",
        "typeName": "Objetivos y resultados clave"
      },
      {
        "createdBy": null,
        "createdDate": "2025-12-05T18:46:35.676Z",
        "lastModifiedBy": null,
        "lastModifiedDate": "2025-12-05T18:46:35.676Z",
        "id": 3,
        "typeCode": "1",
        "typeName": "ESTRATÉGICOS - DE AÑO\t"
      },
      {
        "createdBy": null,
        "createdDate": "2025-12-05T18:46:39.865Z",
        "lastModifiedBy": null,
        "lastModifiedDate": "2025-12-05T18:46:39.865Z",
        "id": 4,
        "typeCode": "2",
        "typeName": "OPERATIVOS - REPETITIVOS\t"
      },
      {
        "createdBy": null,
        "createdDate": "2026-01-29T04:47:04.884Z",
        "lastModifiedBy": null,
        "lastModifiedDate": "2026-01-29T04:47:04.884Z",
        "id": 5,
        "typeCode": "Ob12",
        "typeName": "Objetivo Nuevo"
      },
      {
        "createdBy": null,
        "createdDate": "2026-01-29T04:47:17.372Z",
        "lastModifiedBy": null,
        "lastModifiedDate": "2026-01-29T04:47:28.000Z",
        "id": 6,
        "typeCode": "Ob12",
        "typeName": "Objetivo Nuevo"
      },
      {
        "createdBy": null,
        "createdDate": "2026-01-29T04:47:39.924Z",
        "lastModifiedBy": null,
        "lastModifiedDate": "2026-01-29T04:47:39.924Z",
        "id": 7,
        "typeCode": "Ob12",
        "typeName": "Objetivo Nuevo"
      },
      {
        "createdBy": null,
        "createdDate": "2026-01-29T04:51:48.347Z",
        "lastModifiedBy": null,
        "lastModifiedDate": "2026-01-29T05:04:28.000Z",
        "id": 8,
        "typeCode": "31",
        "typeName": "Especialista en Manejo de Tierras, Recursos Hídricos y Flora (Jardinero). Técnico en Recepción y Archivo Definitivo de Recursos Humanos (Sepulturero). Especialista en Manejo de Tierras, Recursos Hídricos y Flora (Jardinero). Técnico en Recepción"
      },
      {
        "createdBy": null,
        "createdDate": "2026-01-29T18:59:13.206Z",
        "lastModifiedBy": null,
        "lastModifiedDate": "2026-01-29T18:59:13.206Z",
        "id": 9,
        "typeCode": "2",
        "typeName": "OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS"
      },
      {
        "createdBy": null,
        "createdDate": "2026-01-29T19:13:38.235Z",
        "lastModifiedBy": null,
        "lastModifiedDate": "2026-01-29T19:13:38.235Z",
        "id": 10,
        "typeCode": "2",
        "typeName": "OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS OPERATIVOS - REPETITIVOS"
      }
    ],
    9
  ];

  return NextResponse.json(data);
}
