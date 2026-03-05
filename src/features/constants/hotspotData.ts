export interface Hotspot {
    id: string;
    worldPos: { x: number; y: number; z: number };
    icon: string;
    label: string;
    title: string;
    subtitle: string;
    desc: string;
    facts: { label: string; value: string }[];
    tags: { text: string; color: string }[];
}

export const HOTSPOTS: Hotspot[] = [
    {
        id: "dry-garden",
        worldPos: { x: 0, y: 0.8, z: 0 },
        icon: "🏜️",
        label: "Dry Garden",
        title: "Our Rainwater Arid Zone",
        subtitle: "Beauty in Resilience",
        desc: "A stunning xeriscape showcasing desert flora and specialized irrigation techniques, proving that a garden can flourish even in the most challenging conditions.",
        facts: [
            { label: "Species", value: "32 Native" },
            { label: "Irrigation", value: "Sub-surface Drip" },
        ],
        tags: [
            { text: "Sustainable", color: "rgba(201, 184, 154, 0.4)" },
            { text: "Resilient", color: "rgba(255, 165, 0, 0.2)" },
        ],
    },
    {
        id: "water-garden",
        worldPos: { x: -3, y: 1.0, z: -2 },
        icon: "💧",
        label: "Water Garden",
        title: "The Reflecting Pools",
        subtitle: "Lush Aquatic Sanctuary",
        desc: "A network of interconnected pools and canals that cool the surrounding area and harbor rare water lilies, symbolizing the cycle of life.",
        facts: [
            { label: "Cooling Effect", value: "-4°C" },
            { label: "Purification", value: "Bio-filter" },
        ],
        tags: [
            { text: "Lush", color: "rgba(74, 181, 176, 0.4)" },
            { text: "Cooling", color: "rgba(0, 191, 255, 0.2)" },
        ],
    },
    {
        id: "stats",
        worldPos: { x: 3, y: 2.0, z: -4 },
        icon: "📊",
        label: "Statistics",
        title: "Eco Observation Deck",
        subtitle: "Real-time Metrics",
        desc: "Live data from across the garden, monitoring soil moisture, solar energy harvesting, and the well-being of the Our Rainwater ecosystem.",
        facts: [
            { label: "Solar Energy", value: "14.2 kWh/day" },
            { label: "Soil Health", value: "Optimal" },
        ],
        tags: [
            { text: "Live Data", color: "rgba(255, 255, 255, 0.2)" },
            { text: "Smart Tech", color: "rgba(74, 181, 176, 0.4)" },
        ],
    },
];
