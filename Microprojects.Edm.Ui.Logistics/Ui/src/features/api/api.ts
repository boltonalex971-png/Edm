const baseUrl = 'http://mp-bolotinan:16331' //process.env.REACT_APP_API_URL || window.location.origin;

const api = {
    baseUrl: baseUrl,
    auth: `${baseUrl}/api/auth`,
    processes: `${baseUrl}/api/logistics/processes`,
    directories: `${baseUrl}/api/logistics/directories`
};

export default api;
