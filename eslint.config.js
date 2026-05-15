import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const screepsGlobals = {
  ATTACK: 'readonly',
  CARRY: 'readonly',
  ERR_NOT_IN_RANGE: 'readonly',
  FIND_CONSTRUCTION_SITES: 'readonly',
  FIND_DROPPED_RESOURCES: 'readonly',
  FIND_HOSTILE_CREEPS: 'readonly',
  FIND_MY_CREEPS: 'readonly',
  FIND_MY_SPAWNS: 'readonly',
  FIND_MY_STRUCTURES: 'readonly',
  FIND_SOURCES: 'readonly',
  FIND_STRUCTURES: 'readonly',
  Game: 'readonly',
  HEAL: 'readonly',
  Memory: 'writable',
  MOVE: 'readonly',
  RANGED_ATTACK: 'readonly',
  RESOURCE_ENERGY: 'readonly',
  STRUCTURE_CONTAINER: 'readonly',
  STRUCTURE_EXTENSION: 'readonly',
  STRUCTURE_RAMPART: 'readonly',
  STRUCTURE_ROAD: 'readonly',
  STRUCTURE_SPAWN: 'readonly',
  STRUCTURE_TOWER: 'readonly',
  STRUCTURE_WALL: 'readonly',
  WORK: 'readonly',
};

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.vitest,
        ...screepsGlobals,
      },
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
);
