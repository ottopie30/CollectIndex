
const fs = require('fs');

const url = 'https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_6.json';

async function run() {
    try {
        console.log('Downloading catalog...');
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const data = await res.json();
        const products = data.products;
        console.log(`Loaded ${products.length} products`);

        // Helper to find expansion ID by card name search
        const searchExpansion = (query) => {
            const matches = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
            const expansions = new Map();

            // Count occurrences of each expansion ID in the matches
            matches.forEach(p => {
                const id = p.idExpansion;
                expansions.set(id, (expansions.get(id) || 0) + 1);
            });

            console.log(`\nSearch for "${query}":`);
            // Sort by count desc
            const sorted = [...expansions.entries()].sort((a, b) => b[1] - a[1]);

            for (const [id, count] of sorted.slice(0, 5)) {
                // Get a sample product name for this expansion
                const sample = matches.find(p => p.idExpansion === id).name;
                console.log(`Expansion ID: ${id} (Count: ${count}) - Sample: ${sample}`);
            }
        };

        const queries = [
            '151',
            'Prismatic',
            'Surging Sparks',
            'Stellar Crown',
            'Shrouded',
            'Twilight Masquerade',
            'Temporal Forces',
            'Paldean Fates',
            'Paradox Rift',
            'Obsidian Flames',
            'Paldea Evolved',
            'Scarlet & Violet'
        ];

        for (const q of queries) {
            searchExpansion(q);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
