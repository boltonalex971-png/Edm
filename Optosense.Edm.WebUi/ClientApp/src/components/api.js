const baseUrl = process.env.REACT_APP_API_URL || window.location.origin;

const api = {
    audits: `${baseUrl}/api/audits`,
    processes: `${baseUrl}/api/processes`,
    devices: `${baseUrl}/api/devices`,
    hosts: `${baseUrl}/api/hosts`,
    workplaces: `${baseUrl}/api/workplaces`,
    operations: `${baseUrl}/api/operations`,
    plugins: `${baseUrl}/api/plugins`,
    profiles: `${baseUrl}/api/profiles`
};

export default api;
