const AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING';

type JwtPayload = {
    role?: string;
};

const decodeJwtPayload = (token: string): JwtPayload | null => {
    try {
        const parts = token.split('.');
        if (parts.length < 2) {
            return null;
        }

        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const payloadJson = atob(padded);
        return JSON.parse(payloadJson) as JwtPayload;
    } catch {
        return null;
    }
};

export const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

export const requireAuthToken = (): string => {
    const token = getAuthToken();
    if (!token) {
        throw new Error(AUTH_TOKEN_MISSING);
    }
    return token;
};

export const buildAuthHeaders = (): Record<string, string> => {
    const token = requireAuthToken();
    return { Authorization: `Bearer ${token}` };
};

export const isAuthTokenMissingError = (error: unknown): boolean => {
    return error instanceof Error && error.message === AUTH_TOKEN_MISSING;
};

export const getCurrentUserRole = (): string | null => {
    const token = getAuthToken();
    if (token) {
        const payload = decodeJwtPayload(token);
        if (payload?.role) {
            return payload.role;
        }
    }

    try {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) {
            return null;
        }

        const parsed = JSON.parse(rawUser) as { role?: string | { name?: string } };
        if (typeof parsed.role === 'string') {
            return parsed.role;
        }
        return parsed.role?.name ?? null;
    } catch {
        return null;
    }
};
