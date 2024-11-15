export interface SearchDeferment {
    jql: string;
    maxResults: string;
}

export interface SearchDefermentResponse {
    expand: string;
    maxResults: number;
    total: number;
    issues: [
        {
            expand: string;
            id: string;
            self: string;
            key: string;
            fields: object;
        },
    ];
}

export interface VipDefermentRequest {
    fields: {
        project: {
            key: string;
        };
        issuetype: {
            name: string;
        };
        summary: string;
       
        customfield_23518: string;
        customfield_23507: string;
        customfield_23551: string;
        customfield_16700: string | null;
        customfield_18808: string | null;
        customfield_23535: string;
        customfield_23530: string;
        customfield_23529: string;
        customfield_23511: string;
        reporter: {
            name: string;
        };
        customfield_23541: number | null;
        customfield_23517: number | null;
        customfield_23515: number | null;
        customfield_23534: number | null;
        customfield_23502: number | null;
        customfield_23523: number | null;
        customfield_23559: number;
        customfield_23545: number | null;
        customfield_23509: number | null;
        customfield_23561?: number;
        customfield_23537?: {
            value?: string;
        };
        customfield_23544?: {
            value?: string;
        };
        customfield_23525?: {
            value?: string;
        };
        customfield_23557?: {
            value?: string;
        };
        customfield_14920?: {
            value?: string;
        };
    };
}

export interface JiraAttributes {
    jiraAsset: string;
    multiplicationFactor: number;
}

export interface HandlerResponse {
    statusCode: string;
    body: string;
}

export interface ClientCredentials {
    client_id: string;
    client_secret: string;
    username: string;
    password: string;
}
