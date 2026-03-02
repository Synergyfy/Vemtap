export type BusinessUser = {
    id: string;
    name: string;
    email: string;
    role: 'Owner' | 'Manager' | 'Staff';
    status: 'Active' | 'Invited' | 'Suspended';
};

export type BusinessDevice = {
    id: string;
    name: string;
    location: string;
    status: 'Active' | 'Offline' | 'Maintenance';
    lastSync: string;
};

export type BusinessTap = {
    id: string;
    visitorName: string;
    deviceName: string;
    time: string;
    type: 'New' | 'Returning';
};

export type BusinessDetailsSnapshot = {
    id: string;
    name: string;
    status: 'Active' | 'Pending' | 'Suspended';
    users: BusinessUser[];
    devices: BusinessDevice[];
    taps: BusinessTap[];
    analytics: {
        activeUsers30d: number;
        totalTaps30d: number;
        conversionRate: number;
    };
};

const hash = (value: string) => {
    let out = 0;
    for (let i = 0; i < value.length; i += 1) {
        out = (out << 5) - out + value.charCodeAt(i);
        out |= 0;
    }
    return Math.abs(out);
};

export function getBusinessDetailsSnapshot(id: string, name?: string): BusinessDetailsSnapshot {
    const seed = hash(id);
    const businessName = name || `Business ${id}`;
    const usersCount = 10 + (seed % 15);
    const devicesCount = 3 + (seed % 8);
    const tapsCount = 40 + (seed % 80);

    const users: BusinessUser[] = Array.from({ length: usersCount }).map((_, idx) => ({
        id: `${id}_user_${idx + 1}`,
        name: `User ${idx + 1}`,
        email: `user${idx + 1}@${businessName.toLowerCase().replace(/\s+/g, '')}.mock`,
        role: idx === 0 ? 'Owner' : idx % 4 === 0 ? 'Manager' : 'Staff',
        status: idx % 9 === 0 ? 'Invited' : idx % 11 === 0 ? 'Suspended' : 'Active',
    }));

    const devices: BusinessDevice[] = Array.from({ length: devicesCount }).map((_, idx) => ({
        id: `${id}_dev_${idx + 1}`,
        name: `Tap Terminal ${idx + 1}`,
        location: `Branch ${1 + (idx % 4)}`,
        status: idx % 6 === 0 ? 'Offline' : idx % 7 === 0 ? 'Maintenance' : 'Active',
        lastSync: idx % 6 === 0 ? '2h ago' : 'Just now',
    }));

    const taps: BusinessTap[] = Array.from({ length: tapsCount }).map((_, idx) => ({
        id: `${id}_tap_${idx + 1}`,
        visitorName: `Visitor ${idx + 1}`,
        deviceName: `Tap Terminal ${1 + (idx % devicesCount)}`,
        time: `${1 + (idx % 12)}h ago`,
        type: idx % 3 === 0 ? 'New' : 'Returning',
    }));

    return {
        id,
        name: businessName,
        status: seed % 9 === 0 ? 'Suspended' : seed % 5 === 0 ? 'Pending' : 'Active',
        users,
        devices,
        taps,
        analytics: {
            activeUsers30d: Math.max(5, Math.floor(usersCount * 0.72)),
            totalTaps30d: tapsCount * 28,
            conversionRate: 18 + (seed % 42),
        },
    };
}
