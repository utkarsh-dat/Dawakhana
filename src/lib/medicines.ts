export interface Medicine {
    id: string;
    name: string;
    category: "Wellness" | "Prescriptions" | "Baby Care" | "Personal Care" | "Healthcare";
    price: number;
    description: string;
    image: string;
    inStock: boolean;
    rating: number;
    reviews: number;
}

export const medicines: Medicine[] = [
    {
        id: "1",
        name: "Paracetamol 500mg",
        category: "Prescriptions",
        price: 15.00,
        description: "Effective relief from fever and mild to moderate pain.",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
        inStock: true,
        rating: 4.8,
        reviews: 1250,
    },
    {
        id: "2",
        name: "Vitamin C Supplements",
        category: "Wellness",
        price: 45.50,
        description: "Supports immune system and skin health.",
        image: "https://images.unsplash.com/photo-1625281313508-2a1389de7856?w=400&h=400&fit=crop",
        inStock: true,
        rating: 4.9,
        reviews: 840,
    },
    {
        id: "3",
        name: "Baby Moisturizer",
        category: "Baby Care",
        price: 32.00,
        description: "Gentle and hydrating moisturizer for sensitive baby skin.",
        image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop",
        inStock: true,
        rating: 4.7,
        reviews: 620,
    },
    {
        id: "4",
        name: "Digital Thermometer",
        category: "Healthcare",
        price: 25.00,
        description: "Fast and accurate temperature reading.",
        image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=400&fit=crop",
        inStock: true,
        rating: 4.6,
        reviews: 156,
    },
    {
        id: "5",
        name: "Organic Honey 500g",
        category: "Wellness",
        price: 18.00,
        description: "Pure organic honey, rich in antioxidants.",
        image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop",
        inStock: true,
        rating: 4.9,
        reviews: 430,
    },
    {
        id: "6",
        name: "Face Wash Gel",
        category: "Personal Care",
        price: 22.50,
        description: "Refreshing face wash for daily use.",
        image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
        inStock: true,
        rating: 4.5,
        reviews: 210,
    },
    {
        id: "7",
        name: "Antiseptic Liquid",
        category: "Healthcare",
        price: 12.00,
        description: "Effective protection against germs and infections.",
        image: "https://images.unsplash.com/photo-1583946099379-f9c9cb8bc030?w=400&h=400&fit=crop",
        inStock: true,
        rating: 4.8,
        reviews: 980,
    },
    {
        id: "8",
        name: "Baby Diapers (64 Pack)",
        category: "Baby Care",
        price: 55.00,
        description: "Ultra-absorbent and soft diapers for babies.",
        image: "https://images.unsplash.com/photo-1617191196307-28f0967a58e1?w=400&h=400&fit=crop",
        inStock: true,
        rating: 4.7,
        reviews: 1100,
    },
    // Adding more to simulate database
    {
        id: "9",
        name: "Amoxicillin 250mg",
        category: "Prescriptions",
        price: 28.00,
        description: "Broad-spectrum antibiotic for bacterial infections.",
        image: "https://images.unsplash.com/photo-1471864190281-ad5f9f81ce4c?w=400&h=400&fit=crop",
        inStock: false,
        rating: 4.6,
        reviews: 450,
    },
    {
        id: "10",
        name: "Sunscreen SPF 50",
        category: "Personal Care",
        price: 35.00,
        description: "High protection sunscreen for all skin types.",
        image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
        inStock: true,
        rating: 4.8,
        reviews: 720,
    }
];
