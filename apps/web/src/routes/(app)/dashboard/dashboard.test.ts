/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { getNextStatus, getStatusColor } from '$lib/api/client';

describe('Production Store API Helpers', () => {
	describe('getNextStatus', () => {
		it('should return "Mulai Rangkai" for Antri status', () => {
			const result = getNextStatus('Antri');
			expect(result).toEqual({
				label: 'Mulai Rangkai',
				status: 'Dirangkai'
			});
		});

		it('should return "Selesai" for Dirangkai status', () => {
			const result = getNextStatus('Dirangkai');
			expect(result).toEqual({
				label: 'Selesai',
				status: 'Selesai'
			});
		});

		it('should return "Serah Terima" for Selesai status', () => {
			const result = getNextStatus('Selesai');
			expect(result).toEqual({
				label: 'Serah Terima',
				status: 'Diambil'
			});
		});

		it('should return null for Draft status', () => {
			const result = getNextStatus('Draft');
			expect(result).toBeNull();
		});

		it('should return null for Batal status', () => {
			const result = getNextStatus('Batal');
			expect(result).toBeNull();
		});
	});

	describe('getStatusColor', () => {
		it('should return amber color for Antri status', () => {
			const result = getStatusColor('Antri');
			expect(result).toBe('bg-amber-100 text-amber-700');
		});

		it('should return blue color for Dirangkai status', () => {
			const result = getStatusColor('Dirangkai');
			expect(result).toBe('bg-blue-100 text-blue-700');
		});

		it('should return green color for Selesai status', () => {
			const result = getStatusColor('Selesai');
			expect(result).toBe('bg-green-100 text-green-700');
		});

		it('should return red color for Batal status', () => {
			const result = getStatusColor('Batal');
			expect(result).toBe('bg-red-100 text-red-600');
		});

		it('should return default gray for unknown status', () => {
			const result = getStatusColor('Unknown' as any);
			expect(result).toBe('bg-gray-100 text-gray-600');
		});
	});
});
