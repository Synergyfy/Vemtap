// Mock redirection "database"
const redirectMappings: Record<string, string> = {
    'profile-qr': 'http://localhost:3001/tap/demo-business',
};

export const redirectService = {
    getDestination: (id: string) => redirectMappings[id] || null,
    updateDestination: (id: string, url: string) => {
        redirectMappings[id] = url;
        console.log(`[Redirect] Mapping updated: ${id} -> ${url}`);
    }
};
