// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['eslint.config.mjs'],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	eslintPluginPrettierRecommended,

	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
			ecmaVersion: 5,
			sourceType: 'module',
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/interface-name-prefix': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-shadow': ['error'],
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-misused-promises': 'off',
			'@typescript-eslint/unbound-method': 'off',
			'@typescript-eslint/no-inferrable-types': [
				'warn',
				{ ignoreParameters: true },
			],
			'@typescript-eslint/naming-convention': [
				'error',
				// typeLike matches class, enum, interface, typeAlias, and typeParameter
				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},
				{
					selector: 'interface',
					format: ['PascalCase'],
					// Start interfaces with I, e.g. ISomething
					custom: { regex: '^I[A-Z]', match: true },
				},
				{
					selector: 'enum',
					format: ['PascalCase'],
					custom: {
						// Do _not_ start enums with E, e.g. EDirections should just be Directions
						regex: '^E[A-Z]',
						match: false,
					},
				},
				{
					selector: 'enumMember',
					format: ['UPPER_CASE'],
				},
				{
					selector: 'method',
					format: ['camelCase'],
				},
				{
					selector: 'function',
					format: ['camelCase'],
				},
				{
					selector: 'variable',
					types: ['function'],
					format: ['camelCase'],
				},
			],
			'lines-between-class-members': 'error',
			'no-await-in-loop': 'warn',
			'no-trailing-spaces': 'error',

			// to avoid line ending issues in windows & linux (LF vs CRLF)
			'prettier/prettier': ['error', { endOfLine: 'auto' }],
			// prefer template string over concat string
			'prefer-template': 'error',

			semi: ['error', 'always'],
			'object-curly-spacing': ['error', 'always'],
			camelcase: 'off',

			quotes: [2, 'single', { avoidEscape: true }],
			'class-methods-use-this': 'off',
		},
	},
);
