export interface LogEntry {
    id: string;
    time: string;
    type: 'System' | 'Info' | 'Error' | 'Request' | 'Response';
    message: string;
}

export interface LoginConfig {
    SAP_URL: string;
    SAP_USER: string;
    SAP_PASSWORD?: string;
    SAP_CLIENT: string;
    SAP_LANGUAGE: string;
    NODE_TLS_REJECT_UNAUTHORIZED: string;
    HTTP_PROXY?: string;
    HTTPS_PROXY?: string;
    NO_PROXY?: string;
}
