export enum Role {
    RUNNER = 'USER',
    ORGANIZER = 'ORGANIZER',
    RACE_STAFF = 'RACE-STAFF',
}

export const ALL_ROLES: Role[] = Object.values(Role);
