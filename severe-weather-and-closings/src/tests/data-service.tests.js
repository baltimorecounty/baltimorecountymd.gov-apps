/* eslint-env mocha */
import { dataService } from '../services/data-service';
import { dataProvider } from '../providers/data-mock-provider';

const chai = require('chai');

const { expect } = chai;

describe('Severe Weather & Closings Data Service', () => {
	let closingsService;

	before(() => {
		closingsService = new dataService(dataProvider);
	});

	it('Should provide a list of closings', async () => {
		const closings = await closingsService.getClosings();

		expect(closings.length).to.be.gte(1);
	});

	it('Should provide general county closing information', async () => {
		const closing = await closingsService.getGeneralCountyInformation();

		expect(!!closing.status).to.be.eql(true);
		expect(!!closing.info).to.be.eql(true);
	});
});
