import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const data = [
    {
      id: 1,
      label: "Incrementar cuota de mercado",
      data: {
        id: 1,
        name: "Incrementar cuota de mercado",
        code: "OBJ-STRAT-001",
        objectiveType: "Estratégico",
        description: "Alcanzar el 25% del mercado nacional para finales del año fiscal."
      },
      children: [
        {
          id: 2,
          label: "Lanzar nueva línea de productos",
          data: {
            id: 2,
            name: "Lanzar nueva línea de productos",
            code: "OBJ-TACT-001",
            objectiveType: "Táctico",
            description: "Desarrollar y lanzar la línea premium de accesorios."
          },
          children: [
             {
              id: 3,
              label: "Completar investigación de mercado",
              data: {
                id: 3,
                name: "Completar investigación de mercado",
                code: "OBJ-OPER-001",
                objectiveType: "Operativo",
                description: "Finalizar encuestas y focus groups."
              },
              children: []
            }
          ]
        }
      ]
    },
    {
      id: 4,
      label: "Optimizar eficiencia operativa",
      data: {
        id: 4,
        name: "Optimizar eficiencia operativa",
        code: "OBJ-STRAT-002",
        objectiveType: "Estratégico",
        description: "Reducir costos operativos en un 15%."
      },
      children: []
    },
    {
        id: 5,
        label: "Transformación Digital",
        data: {
          id: 5,
          name: "Transformación Digital",
          code: "OBJ-STRAT-003",
          objectiveType: "Estratégico",
          description: "Digitalizar el 100% de los procesos core."
        },
        children: [
            {
                id: 6,
                label: "Migración a la nube",
                data: {
                  id: 6,
                  name: "Migración a la nube",
                  code: "OBJ-TACT-002",
                  objectiveType: "Táctico",
                  description: "Migrar servidores on-premise a AWS."
                },
                children: []
              }
        ]
      }
  ];

  return NextResponse.json(data);
}
