export enum Role {
    ADMIN = 'ADMIN',
    PHOTOGRAPHER = 'PHOTOGRAPHER',
    RUNNER = 'RUNNER',
    ORGANIZER = 'ORGANIZER',
    STAFF = 'STAFF',
    COORDINATOR = 'COORDINATOR',
}

export const ALL_ROLES: Role[] = Object.values(Role);