const { DateTime } = require('luxon');

function getExaminationDateError(day, month, year, label) {
	const values = [day, month, year].map((value) => String(value || '').trim());
	if (values.every((value) => !value)) return `Enter the ${label}`;
	if (values.some((value) => !value)) return `Enter a complete ${label}`;
	if (!/^\d{1,2}$/.test(values[0]) || !/^\d{1,2}$/.test(values[1]) || !/^\d{4}$/.test(values[2])) {
		return `Enter a valid ${label}`;
	}

	const date = DateTime.fromObject({ day: Number(values[0]), month: Number(values[1]), year: Number(values[2]) });
	return date.isValid && date.day === Number(values[0]) && date.month === Number(values[1]) && date.year === Number(values[2])
		? ''
		: `Enter a valid ${label}`;
}

module.exports = { getExaminationDateError };
