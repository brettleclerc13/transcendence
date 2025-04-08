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
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				defaultMessages.errorMessage;
			throw new Error(errorMessage);
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
