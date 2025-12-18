// Pokemon Name Translations - French ↔ English mapping
// Used for multilingual search support

// Top 151 Kanto Pokémon names (most commonly searched)
export const POKEMON_NAMES_FR_EN: Record<string, string> = {
    // French → English
    'bulbizarre': 'bulbasaur',
    'herbizarre': 'ivysaur',
    'florizarre': 'venusaur',
    'salamèche': 'charmander',
    'reptincel': 'charmeleon',
    'dracaufeu': 'charizard',
    'carapuce': 'squirtle',
    'carabaffe': 'wartortle',
    'tortank': 'blastoise',
    'chenipan': 'caterpie',
    'chrysacier': 'metapod',
    'papilusion': 'butterfree',
    'aspicot': 'weedle',
    'coconfort': 'kakuna',
    'dardargnan': 'beedrill',
    'roucool': 'pidgey',
    'roucoups': 'pidgeotto',
    'roucarnage': 'pidgeot',
    'rattata': 'rattata',
    'rattatac': 'raticate',
    'piafabec': 'spearow',
    'rapasdepic': 'fearow',
    'abo': 'ekans',
    'arbok': 'arbok',
    'pikachu': 'pikachu',
    'raichu': 'raichu',
    'sabelette': 'sandshrew',
    'sablaireau': 'sandslash',
    'nidoran♀': 'nidoran♀',
    'nidorina': 'nidorina',
    'nidoqueen': 'nidoqueen',
    'nidoran♂': 'nidoran♂',
    'nidorino': 'nidorino',
    'nidoking': 'nidoking',
    'mélofée': 'clefairy',
    'mélodelfe': 'clefable',
    'goupix': 'vulpix',
    'feunard': 'ninetales',
    'rondoudou': 'jigglypuff',
    'grodoudou': 'wigglytuff',
    'nosferapti': 'zubat',
    'nosferalto': 'golbat',
    'mystherbe': 'oddish',
    'ortide': 'gloom',
    'rafflesia': 'vileplume',
    'paras': 'paras',
    'parasect': 'parasect',
    'mimitoss': 'venonat',
    'aéromite': 'venomoth',
    'taupiqueur': 'diglett',
    'triopikeur': 'dugtrio',
    'miaouss': 'meowth',
    'persian': 'persian',
    'psykokwak': 'psyduck',
    'akwakwak': 'golduck',
    'férosinge': 'mankey',
    'colossinge': 'primeape',
    'caninos': 'growlithe',
    'arcanin': 'arcanine',
    'ptitard': 'poliwag',
    'têtarte': 'poliwhirl',
    'tartard': 'poliwrath',
    'abra': 'abra',
    'kadabra': 'kadabra',
    'alakazam': 'alakazam',
    'machoc': 'machop',
    'machopeur': 'machoke',
    'mackogneur': 'machamp',
    'chétiflor': 'bellsprout',
    'boustiflor': 'weepinbell',
    'empiflor': 'victreebel',
    'tentacool': 'tentacool',
    'tentacruel': 'tentacruel',
    'racaillou': 'geodude',
    'gravalanch': 'graveler',
    'grolem': 'golem',
    'ponyta': 'ponyta',
    'galopa': 'rapidash',
    'ramoloss': 'slowpoke',
    'flagadoss': 'slowbro',
    'magnéti': 'magnemite',
    'magnéton': 'magneton',
    'canarticho': 'farfetchd',
    'doduo': 'doduo',
    'dodrio': 'dodrio',
    'otaria': 'seel',
    'lamantine': 'dewgong',
    'tadmorv': 'grimer',
    'grotadmorv': 'muk',
    'kokiyas': 'shellder',
    'crustabri': 'cloyster',
    'fantominus': 'gastly',
    'spectrum': 'haunter',
    'ectoplasma': 'gengar',
    'onix': 'onix',
    'soporifik': 'drowzee',
    'hypnomade': 'hypno',
    'krabby': 'krabby',
    'krabboss': 'kingler',
    'voltorbe': 'voltorb',
    'électrode': 'electrode',
    'noeunoeuf': 'exeggcute',
    'noadkoko': 'exeggutor',
    'osselait': 'cubone',
    'ossatueur': 'marowak',
    'kicklee': 'hitmonlee',
    'tygnon': 'hitmonchan',
    'excelangue': 'lickitung',
    'smogo': 'koffing',
    'smogogo': 'weezing',
    'rhinocorne': 'rhyhorn',
    'rhinoféros': 'rhydon',
    'leveinard': 'chansey',
    'saquedeneu': 'tangela',
    'kangourex': 'kangaskhan',
    'hypotrempe': 'horsea',
    'hypocéan': 'seadra',
    'poissirène': 'goldeen',
    'poissoroy': 'seaking',
    'stari': 'staryu',
    'staross': 'starmie',
    'mrmime': 'mrmime',
    'insécateur': 'scyther',
    'lippoutou': 'jynx',
    'élektek': 'electabuzz',
    'magmar': 'magmar',
    'scarabrute': 'pinsir',
    'tauros': 'tauros',
    'magicarpe': 'magikarp',
    'léviator': 'gyarados',
    'lokhlass': 'lapras',
    'métamorph': 'ditto',
    'évoli': 'eevee',
    'aquali': 'vaporeon',
    'voltali': 'jolteon',
    'pyroli': 'flareon',
    'porygon': 'porygon',
    'amonita': 'omanyte',
    'amonistar': 'omastar',
    'kabuto': 'kabuto',
    'kabutops': 'kabutops',
    'ptéra': 'aerodactyl',
    'ronflex': 'snorlax',
    'artikodin': 'articuno',
    'électhor': 'zapdos',
    'sulfura': 'moltres',
    'minidraco': 'dratini',
    'draco': 'dragonair',
    'dracolosse': 'dragonite',
    'mewtwo': 'mewtwo',
    'mew': 'mew',
}

// Build reverse mapping (English → French)
export const POKEMON_NAMES_EN_FR: Record<string, string> = Object.fromEntries(
    Object.entries(POKEMON_NAMES_FR_EN).map(([fr, en]) => [en, fr])
)

// Translate a search query from French to English if needed
export function translateSearchQuery(query: string): { original: string; translated: string | null; language: 'fr' | 'en' | 'unknown' } {
    const normalizedQuery = query.toLowerCase().trim()

    // Check if it's a French name
    if (POKEMON_NAMES_FR_EN[normalizedQuery]) {
        return {
            original: query,
            translated: POKEMON_NAMES_FR_EN[normalizedQuery],
            language: 'fr'
        }
    }

    // Check if it's an English name
    if (POKEMON_NAMES_EN_FR[normalizedQuery]) {
        return {
            original: query,
            translated: null, // Already in English
            language: 'en'
        }
    }

    // Unknown - could be partial match or non-Pokemon search
    return {
        original: query,
        translated: null,
        language: 'unknown'
    }
}

// Get both FR and EN versions of a name for expanded search
export function getMultilingualSearchTerms(query: string): string[] {
    const normalizedQuery = query.toLowerCase().trim()
    const terms = [query] // Always include original

    // If French name, add English translation
    if (POKEMON_NAMES_FR_EN[normalizedQuery]) {
        terms.push(POKEMON_NAMES_FR_EN[normalizedQuery])
    }

    // If English name, add French translation
    if (POKEMON_NAMES_EN_FR[normalizedQuery]) {
        terms.push(POKEMON_NAMES_EN_FR[normalizedQuery])
    }

    return [...new Set(terms)] // Remove duplicates
}

// Search with both languages
export async function searchMultilingual(
    query: string,
    searchFn: (q: string) => Promise<unknown[]>
): Promise<unknown[]> {
    const terms = getMultilingualSearchTerms(query)

    // Search with all terms in parallel
    const results = await Promise.all(
        terms.map(term => searchFn(term))
    )

    // Merge and deduplicate results (assuming results have 'id' field)
    const seen = new Set<string>()
    const merged: unknown[] = []

    for (const resultSet of results) {
        for (const item of resultSet) {
            const id = (item as { id?: string }).id
            if (id && !seen.has(id)) {
                seen.add(id)
                merged.push(item)
            }
        }
    }

    return merged
}
