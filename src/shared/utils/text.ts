export function trimToMaxLength(input: string, maxLength: number): string {
	if (maxLength <= 0) {
		return '';
	}
	if (input.length <= maxLength) {
		return input;
	}
	// Leave room for the ellipsis character.
	return `${input.slice(0, Math.max(0, maxLength - 1))}…`;
}
