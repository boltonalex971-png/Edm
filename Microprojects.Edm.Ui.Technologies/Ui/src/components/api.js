const baseUrl = import.meta.env.PUBLIC_APP_API_URL || window.location.origin;

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
