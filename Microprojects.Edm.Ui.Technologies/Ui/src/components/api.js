const baseUrl = import.meta.env.PUBLIC_APP_API_URL || window.location.origin;
/* React Router runs with `basename={ASSET_PREFIX}` (see index.js), so any
   raw `window.open()` or `<a href>` that targets an in-app SPA route must
   prepend the same prefix. In dev ASSET_PREFIX is '/'; in prod it's
   '/technologies'. spaUrl() rolls both into one absolute URL. */
const assetPrefix = (import.meta.env.ASSET_PREFIX || '').replace(/\/$/, '');

export const spaUrl = (path) => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${assetPrefix}${normalized}`;
};

const api = {
    baseUrl: baseUrl,
    auth: `${baseUrl}/api/auth`,
    audits: `${baseUrl}/api/technologies/audits`,
    processes: `${baseUrl}/api/technologies/processes`,
    devices: `${baseUrl}/api/technologies/devices`,
    hosts: `${baseUrl}/api/technologies/hosts`,
    workplaces: `${baseUrl}/api/technologies/workplaces`,
    operations: `${baseUrl}/api/technologies/operations`,
    plugins: `${baseUrl}/api/technologies/plugins`,
    profiles: `${baseUrl}/api/technologies/profiles`,
    hierarchies: `${baseUrl}/api/technologies/hierarchies`,
    meta: `${baseUrl}/api/technologies/meta`
};

export default api;
