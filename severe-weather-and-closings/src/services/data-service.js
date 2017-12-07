export class dataService {
	constructor(dataProvider) {
		this.dataProvider = new dataProvider();
	}

	getClosings() {
		return this.dataProvider.getClosings();
	}

	getGeneralCountyInformation() {
		return this.dataProvider.getGeneralCountyInformation();
	}
}
