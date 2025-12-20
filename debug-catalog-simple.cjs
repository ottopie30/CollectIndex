
const fs = require('fs');

const url = 'https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_6.json';

async function run() {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const data = await res.json();
        const products = data.products;

        const queries = {
            'sv8pt5': 'Prismatic Evolutions',
            'sv8': 'Surging Sparks',
            'sv7': 'Stellar Crown',
            'sv6pt5': 'Shrouded Fable',
            'sv6': 'Twilight Masquerade',
            'sv5': 'Temporal Forces',
            'sv4pt5': 'Paldean Fates',
            'sv4': 'Paradox Rift',
            'sv3pt5': '151',
            'sv3': 'Obsidian Flames',
            'sv2': 'Paldea Evolved',
            'sv1': 'Scarlet & Violet'
        };

        const results = {};

        for (const [code, name] of Object.entries(queries)) {
            // Find most frequent expansion ID for this name
            const matches = products.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
            const expansions = {};
            matches.forEach(p => {
                const id = p.idExpansion;
                expansions[id] = (expansions[id] || 0) + 1;
            });

            // Get top ID
            const topId = Object.entries(expansions).sort((a, b) => b[1] - a[1])[0];
            if (topId) {
                results[code] = {
                    id: parseInt(topId[0]),
                    count: topId[1],
                    sample: matches.find(p => p.idExpansion == topId[0]).name
                };
            }
        }

        fs.writeFileSync('catalog_ids.json', JSON.stringify(results, null, 2));
        console.log('Done');

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
