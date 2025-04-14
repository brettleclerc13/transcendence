export async function fetchGenericAPIResponses({
	response,
	defaultMessages,
}: {
	response: Response;
	defaultMessages: {
		errorMessage: string;
		successMessage: string;
	};
}) {
	try {
		let data;
		const text = await response.text();

		try {
			data = text ? JSON.parse(text) : {};
		} catch {
			throw new Error(`Unexpected response: ${response.status}`);
		}

		if (!response.ok) {
			const errorMessage =
				data.error ||
				data.message ||
				defaultMessages.errorMessage;
			return {
				ok: false,
				error: errorMessage || defaultMessages.errorMessage,
			};
		} else {
			return {
				ok: true,
				message: data.message || defaultMessages.successMessage,
			};
		}
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || defaultMessages.errorMessage,
		};
	}
}

export async function fetchAPIResponseData({
	response,
	defaultMessages,
}: {
	response: Response;
	defaultMessages: {
		errorMessage: string;
		successMessage: string;
	};
}) {
	try {
		let data;
		const text = await response.text();

		try {
			data = text ? JSON.parse(text) : {};
		} catch {
			throw new Error(`Unexpected response: ${response.status}`);
		}

		if (!response.ok) {
			const errorMessage =
				data.error ||
				data.message ||
				defaultMessages.errorMessage;
			return {
				ok: false,
				error: errorMessage || defaultMessages.errorMessage,
			};
		} else {
			return {
				ok: true,
				message: data.message || defaultMessages.successMessage,
				data: data,
			};
		}
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || defaultMessages.errorMessage,
		};
	}
}
