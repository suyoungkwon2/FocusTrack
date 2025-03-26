module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/__tests__/**'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
}; 