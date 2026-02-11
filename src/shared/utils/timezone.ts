export function formatToIST(isoDateTime: string): string {
	const date = new Date(isoDateTime);

	if (Number.isNaN(date.getTime())) {
		return isoDateTime;
	}

	// Example: 10 Feb 2026, 18:40 IST
	const formatted = new Intl.DateTimeFormat('en-IN', {
		timeZone: 'Asia/Kolkata',
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).format(date);

	return `${formatted} IST`;
}
