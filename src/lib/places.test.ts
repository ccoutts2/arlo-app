import { describe, expect, it } from 'vitest';
import { directionsLinks } from './places';

describe('directionsLinks', () => {
	it('uses the pin when there is one', () => {
		const l = directionsLinks({ name: 'Bushy Park', lat: 51.41, lng: -0.337 });
		expect(l.apple).toBe('https://maps.apple.com/?daddr=51.41,-0.337&q=Bushy%20Park');
		expect(l.google).toBe('https://www.google.com/maps/dir/?api=1&destination=51.41,-0.337');
		expect(l.waze).toBe('https://waze.com/ul?ll=51.41,-0.337&navigate=yes');
	});
	it('searches by name without a pin', () => {
		const l = directionsLinks({ name: 'Ham Common', lat: null, lng: null });
		expect(l.apple).toBe('https://maps.apple.com/?q=Ham%20Common');
		expect(l.google).toBe('https://www.google.com/maps/dir/?api=1&destination=Ham%20Common');
		expect(l.waze).toBe('https://waze.com/ul?q=Ham%20Common&navigate=yes');
	});
});
