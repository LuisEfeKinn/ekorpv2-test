// Mock data para el sistema de recompensas de usuarios

export interface IRewardProduct {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  stock: number;
  maxStock: number;
  image: string;
  rating: number;
  featured?: boolean;
  badge?: string;
}

export interface IRewardCategory {
  id: string;
  name: string;
  count: number;
}

// Categorías disponibles
export const REWARD_CATEGORIES: IRewardCategory[] = [
  { id: 'todos', name: 'Todos', count: 0 },
  { id: 'papeleria', name: 'Papelería', count: 0 },
  { id: 'accesorios-oficina', name: 'Accesorios De Oficina', count: 0 },
  { id: 'videojuegos', name: 'Videojuegos', count: 0 },
  { id: 'certificados', name: 'Certificados', count: 0 },
  { id: 'bonos-descuentos', name: 'Bonos Descuentos', count: 0 },
];

// Productos de recompensa
export const REWARD_PRODUCTS: IRewardProduct[] = [
  {
    id: '1',
    name: 'Cuaderno para estudiante',
    description: 'Gana un cuaderno generando puntos por inscribirse a nuestros cursos.',
    points: 5,
    category: 'papeleria',
    stock: 6,
    maxStock: 10,
    image: 'https://http2.mlstatic.com/D_NQ_NP_643778-MCO89147318599_082025-O.webp',
    rating: 5,
    featured: true,
  },
  {
    id: '2',
    name: 'Agenda Universitaria',
    description: 'Una agenda perfecta para organizar tus actividades diarias.',
    points: 5,
    category: 'accesorios-oficina',
    stock: 9,
    maxStock: 10,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyXtH2rxfGtImv661r_5K-EI_mnNfETXgioQ&s',
    rating: 0,
  },
  {
    id: '3',
    name: 'Vaso Para Estudiante',
    description: 'Un vaso térmico para mantener tus bebidas calientes o frías durante tus largas jornadas de estudio.',
    points: 5,
    category: 'accesorios-oficina',
    stock: 6,
    maxStock: 10,
    image: 'https://m.media-amazon.com/images/I/7151RtDyTnL._UF894,1000_QL80_.jpg',
    rating: 0,
    badge: 'Disponibles',
  },
  {
    id: '4',
    name: 'Libreta De Cognos',
    description: 'Una libreta donde puedes guardar tus apuntes muy valiosos.',
    points: 5,
    category: 'accesorios-oficina',
    stock: 10,
    maxStock: 10,
    image: '/assets/images/rewards/notebook.jpg',
    rating: 0,
  },
  {
    id: '5',
    name: 'Termo Para Estudiante',
    description: 'Un termo fácil de usar y práctico para conservar tus bebidas el mejor tiempo posible.',
    points: 8,
    category: 'accesorios-oficina',
    stock: 15,
    maxStock: 20,
    image: 'https://image.made-in-china.com/202f0j00YMAkLZVsrUqi/30oz-Tumbler-Water-Bottle-Blank-Sublimation-Stainless-Steel-Matte-Colored-School-Student-Tumblers-Portable-Tumblers-with-Handle-for-Sublimation-Printing.webp',
    rating: 4,
  },
  {
    id: '6',
    name: 'Llavero para estudiante',
    description: 'Llavero con diseño divertido para estudiantes.',
    points: 3,
    category: 'papeleria',
    stock: 20,
    maxStock: 25,
    image: 'https://http2.mlstatic.com/D_NQ_NP_726397-MCO90829324549_082025-O.webp',
    rating: 4,
  },
  {
    id: '7',
    name: 'Bolígrafo para estudiante',
    description: 'Bolígrafo de gel con diseño ergonómico y tinta de calidad.',
    points: 15,
    category: 'certificados',
    stock: 50,
    maxStock: 50,
    image: 'https://http2.mlstatic.com/D_NQ_NP_900293-CBT91919333819_092025-O.webp',
    rating: 5,
    featured: true,
  },
  {
    id: '8',
    name: 'Morral Para Estudiante',
    description: 'Un morral espacioso y resistente para llevar tus materiales escolares.',
    points: 10,
    category: 'bonos-descuentos',
    stock: 100,
    maxStock: 100,
    image: 'https://tottoco.vtexassets.com/arquivos/ids/586100/MA04ECO018-2426J-6YW.jpg?v=638660891720000000',
    rating: 5,
    badge: '20% OFF',
  }
];

// Actualizar conteo de categorías
REWARD_CATEGORIES[0].count = REWARD_PRODUCTS.length; // Todos
REWARD_CATEGORIES.forEach((category) => {
  if (category.id !== 'todos') {
    category.count = REWARD_PRODUCTS.filter((p) => p.category === category.id).length;
  }
});

// Información del usuario
export const USER_REWARDS_INFO = {
  totalPoints: 150,
  pointsUsed: 50,
  availablePoints: 100,
  level: 'Gold',
  nextLevelPoints: 200,
};
