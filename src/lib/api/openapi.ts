// OpenAPI 3.0 Specification for Altum Analytics API
// This file can be served via /api/docs endpoint

export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Altum Analytics API",
        description: `
API publique pour accéder aux données de cartes Pokémon, prix et scores de spéculation.

## Authentification
Utilisez votre clé API dans le header \`X-API-Key\` pour toutes les requêtes.

## Rate Limiting
- **Free**: 100 requêtes/jour
- **Essential**: 1,000 requêtes/jour
- **Pro**: 10,000 requêtes/jour

## Webhooks
Configurez des webhooks pour recevoir des notifications en temps réel sur les changements de prix.
        `,
        version: "1.0.0",
        contact: {
            name: "Altum Analytics Support",
            email: "support@altum-analytics.com"
        }
    },
    servers: [
        {
            url: "https://altum-analytics.vercel.app/api/v1",
            description: "Production"
        },
        {
            url: "http://localhost:3000/api/v1",
            description: "Development"
        }
    ],
    tags: [
        { name: "Cards", description: "Opérations sur les cartes Pokémon" },
        { name: "Prices", description: "Prix et historiques" },
        { name: "Scores", description: "Scores de spéculation et rebond" },
        { name: "Webhooks", description: "Gestion des webhooks" }
    ],
    paths: {
        "/cards/search": {
            get: {
                tags: ["Cards"],
                summary: "Rechercher des cartes",
                description: "Recherche de cartes par nom (FR ou EN)",
                parameters: [
                    {
                        name: "q",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                        description: "Terme de recherche (ex: Charizard, Dracaufeu)"
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", default: 20, maximum: 50 },
                        description: "Nombre de résultats max"
                    }
                ],
                responses: {
                    "200": {
                        description: "Liste des cartes trouvées",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Card" }
                                }
                            }
                        }
                    },
                    "429": { description: "Rate limit dépassé" }
                }
            }
        },
        "/cards/{id}": {
            get: {
                tags: ["Cards"],
                summary: "Obtenir une carte",
                description: "Récupère les détails d'une carte par son ID",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "ID de la carte (ex: base1-4)"
                    }
                ],
                responses: {
                    "200": {
                        description: "Détails de la carte",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CardDetails" }
                            }
                        }
                    },
                    "404": { description: "Carte non trouvée" }
                }
            }
        },
        "/prices/{cardId}": {
            get: {
                tags: ["Prices"],
                summary: "Obtenir les prix d'une carte",
                parameters: [
                    {
                        name: "cardId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    },
                    {
                        name: "history",
                        in: "query",
                        schema: { type: "boolean", default: false },
                        description: "Inclure l'historique des prix"
                    },
                    {
                        name: "days",
                        in: "query",
                        schema: { type: "integer", default: 90 },
                        description: "Nombre de jours d'historique"
                    }
                ],
                responses: {
                    "200": {
                        description: "Prix de la carte",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/PriceData" }
                            }
                        }
                    }
                }
            }
        },
        "/scores/{cardId}": {
            get: {
                tags: ["Scores"],
                summary: "Obtenir les scores d'une carte",
                description: "Score de spéculation et score de rebond",
                parameters: [
                    {
                        name: "cardId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    "200": {
                        description: "Scores de la carte",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Scores" }
                            }
                        }
                    }
                }
            }
        },
        "/webhooks": {
            get: {
                tags: ["Webhooks"],
                summary: "Lister les webhooks",
                security: [{ apiKey: [] }],
                responses: {
                    "200": {
                        description: "Liste des webhooks configurés",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Webhook" }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["Webhooks"],
                summary: "Créer un webhook",
                security: [{ apiKey: [] }],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/WebhookCreate" }
                        }
                    }
                },
                responses: {
                    "201": { description: "Webhook créé" }
                }
            }
        }
    },
    components: {
        securitySchemes: {
            apiKey: {
                type: "apiKey",
                in: "header",
                name: "X-API-Key"
            }
        },
        schemas: {
            Card: {
                type: "object",
                properties: {
                    id: { type: "string", example: "base1-4" },
                    name: { type: "string", example: "Charizard" },
                    set: { type: "string", example: "Base Set" },
                    rarity: { type: "string", example: "Rare Holo" },
                    imageUrl: { type: "string", format: "uri" }
                }
            },
            CardDetails: {
                allOf: [
                    { $ref: "#/components/schemas/Card" },
                    {
                        type: "object",
                        properties: {
                            hp: { type: "integer" },
                            types: { type: "array", items: { type: "string" } },
                            artist: { type: "string" },
                            prices: { $ref: "#/components/schemas/PriceData" },
                            scores: { $ref: "#/components/schemas/Scores" }
                        }
                    }
                ]
            },
            PriceData: {
                type: "object",
                properties: {
                    cardmarket: {
                        type: "object",
                        properties: {
                            trendPrice: { type: "number", example: 150.00 },
                            lowPrice: { type: "number" },
                            avg30: { type: "number" }
                        }
                    },
                    tcgplayer: {
                        type: "object",
                        properties: {
                            market: { type: "number" },
                            low: { type: "number" },
                            high: { type: "number" }
                        }
                    },
                    lastUpdated: { type: "string", format: "date-time" }
                }
            },
            Scores: {
                type: "object",
                properties: {
                    speculation: {
                        type: "object",
                        properties: {
                            total: { type: "integer", minimum: 0, maximum: 100 },
                            volatility: { type: "integer" },
                            growth: { type: "integer" },
                            scarcity: { type: "integer" }
                        }
                    },
                    rebond: {
                        type: "object",
                        properties: {
                            score: { type: "integer", minimum: 0, maximum: 100 },
                            rsi: { type: "number" },
                            macdHistogram: { type: "number" },
                            recommendation: {
                                type: "string",
                                enum: ["strong_buy", "buy", "hold", "sell", "strong_sell"]
                            }
                        }
                    }
                }
            },
            Webhook: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    url: { type: "string", format: "uri" },
                    events: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["price_change", "score_update", "rebond_detected"]
                        }
                    },
                    isActive: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" }
                }
            },
            WebhookCreate: {
                type: "object",
                required: ["url", "events"],
                properties: {
                    url: { type: "string", format: "uri" },
                    events: {
                        type: "array",
                        items: { type: "string" }
                    },
                    secret: { type: "string", description: "Secret pour signer les payloads" }
                }
            }
        }
    }
}

// Export as JSON string for serving
export function getOpenApiJson(): string {
    return JSON.stringify(openApiSpec, null, 2)
}
