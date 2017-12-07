/* eslint-disable import/prefer-default-export */
export class closingsController {
	constructor($sce, dataService) {
		this.dataProvider = dataService;
		this.isLoading = true;
		const data = dataService.getClosings();

		this.list = data.map((item) => {
			const newItem = item;
			newItem.agency = $sce.trustAsHtml(newItem.agency);
			return newItem;
		});

		this.isLoading = false;
	}
};
