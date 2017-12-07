/* eslint-disable class-methods-use-this */

/**
 * Parses an html specified through content inclusions to retreive the data
 */
import * as Closing from '../models/closing';

class htmlparserDataProvider {
	getClosings() {
		const closings = [];
		const closingElms = document.querySelectorAll('.closings-data-snippet');

		closingElms.forEach((closing, index) => {
			const status = closing.children[0].innerHTML;
			const agency = closing.children[1].innerHTML;
			const info = closing.children[2].innerHTML;

			closings.push(new Closing(status, agency, info));
		});

		return closings;
	}

	getGeneralCountyInformation() {
		const generalStatusContainerElm = document.querySelectorAll('.county-closings-status-container');
		const status = generalStatusContainerElm.children[0].innerHTML;
		const info = generalStatusContainerElm.children[2].innerHTML;
		return new Closing(status, null, info);
	}
}

export default htmlparserDataProvider;
