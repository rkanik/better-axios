import _ from 'lodash'
import axios from 'axios'

const jsonParse = input => {
	try {
		let parsed = JSON.parse(input)
		return [false, parsed]
	}
	catch (err) { return [err] }
}

const secureDataType = input => {

	// Non string
	if (typeof input !== 'string') return input

	// Json encoded
	let [err, parsed] = jsonParse(input)
	if (!err) return parsed

	// Empty string
	if (!input.length) return input

	// Possible intended string
	if (input.startsWith('+') || input.startsWith('-')) return input

	// try to convert
	let converted = +input
	if (isNaN(converted)) return input

	return converted
}

const toSnakeCase = (data) => {
	if (_.isString(data)) return _.snakeCase(data)
	if (_.isArray(data)) return data.map(
		el => _.isArray(el) || _.isPlainObject(el)
			? toSnakeCase(el)
			: el
	)
	if (_.isPlainObject(data)) return Object.entries(data)
		.reduce((nData, [key, value]) => {
			nData[toSnakeCase(key)] =
				_.isArray(value) || _.isPlainObject(value)
					? toSnakeCase(value)
					: value;
			return nData
		}, {})
	return data
}

const toCamelCase = (data) => {
	if (_.isString(data)) return _.camelCase(data)
	if (_.isArray(data)) {
		return data.map(el => {
			if (_.isArray(el) || _.isPlainObject(el)) {
				return toCamelCase(el)
			} return el
		})
	}
	if (_.isPlainObject(data)) return Object.entries(data)
		.reduce((nData, [key, value]) => {
			nData[toCamelCase(key)] =
				(_.isArray(value) || _.isPlainObject(value))
					? toCamelCase(value)
					: secureDataType(value);
			return nData
		}, {})
	return data
}

const toSuccess = (res) => {
	if (res.status === 'error') return toError(res)
	let mRes = { ...res }
	delete mRes.code
	delete mRes.status
	let data = {
		...mRes,
		statusCode: res.code,
		statusText: res.status,
		message: res.message || 'Request succeeded'
	}
	return data
}

const toError = (error) => {
	let data = {}
	if (error.response) {
		const res = error.response
		data = {
			...data,
			statusCode: res.status,
			statusText: res.statusText || res.data.status,
		}
		if (res.data.errors) data.errors = Object
			.entries(res.data.errors)
			.reduce((acc, [key, value]) => ({
				...acc, [key]: value
			}), {})
		data.message = res.data.message || res.message
		data.ref = error.response
	}
	else {
		data.statusCode = error.status
		data.statusText = error.statusText
		data.message = error.data.message
		if (error.data.errors) data.errors = error.data.errors
	}
	data.message = data.message || error.message
	return data
}

const handler = async (requestPromise) => {
	try {
		let response = (await requestPromise).data
		return [null, toCamelCase(toSuccess(response))]
	}
	catch (error) {
		return [toCamelCase(toError(error.response || error))]
	}
}

const createAPI = ({ baseURL }) => {

	const api = axios.create({ baseURL })

	return {
		setHeaders(headers) {
			api.defaults.headers.common = {
				...api.defaults.headers.common,
				...headers
			}
		},
		get(endpoint, query = {}) {
			return handler(
				api.get(
					endpoint, {
					params: toSnakeCase(query)
				})
			)
		},
		post(endpoint, body, query = {}) {
			return handler(
				api.post(
					endpoint,
					toSnakeCase(body), {
					params: toSnakeCase(query)
				})
			)
		},
		put(endpoint, body, query = {}) {
			return handler(
				api.put(
					endpoint,
					toSnakeCase(body), {
					params: toSnakeCase(query)
				})
			)
		},
		patch(endpoint, body, query = {}) {
			return handler(
				api.patch(
					endpoint,
					toSnakeCase(body), {
					params: toSnakeCase(query)
				})
			)
		},
		delete(endpoint) {
			return handler(
				api.delete(endpoint)
			)
		}
	}
}

export { createAPI }