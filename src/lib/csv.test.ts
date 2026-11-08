import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
	it('quotes fields, doubles quotes and keeps commas and new lines inside cells', () => {
		expect(
			toCsv(
				['a', 'b'],
				[
					['Hi, "Juno"', 'line\nbreak'],
					[3, null]
				]
			)
		).toBe('"a","b"\r\n"Hi, ""Juno""","line\nbreak"\r\n"3",""\r\n');
	});
});
