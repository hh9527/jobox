function refString(store, s) {
	if (store.smap.hasOwnProperty(s)) {
		return store.smap[s];
	}

	const id = 1 + store.ss.length;
	store.smap[s] = id;
	store.ss.push(s);
	return id;
}

function flat(store, obj) {
	if (!obj || obj === true) return obj;
	switch (typeof obj) {
	case 'number': return obj;
	case 'string': return [ refString(store, obj) ];
	case 'object':
		{
			const i = store.ros.indexOf(obj);
			if (i !== -1) return [ -1 - i ];
			const id = -1 - store.ros.length;
			store.ros.push(obj);
			if (obj instanceof Array) {
				const l = obj.length;
				const fo = new Array(l + 1);
				fo[0] = 0;
				store.fos.push(fo);
				for (let i = 0; i < l; ++i) {
					fo[i + 1] = flat(store, obj[i]);
				}
			} else {
				const fo = [1];
				store.fos.push(fo);
				for (let k in obj) {
					if (!obj.hasOwnProperty(k)) continue;
					fo.push(k ? refString(store, k) : k);
					fo.push(flat(store, obj[k]));
				}
			}
			return [ id ];
		}
	default: return undefined;
	}
}

export function box(obj) {
	if (typeof obj === 'string') return obj;
	const store = {
		fos: [],
		ss: [],
		ros: [],
		smap: {},
	};

	const value = flat(store, obj);
	if (value instanceof Array) {
		return [value[0], store.ss, store.fos];
	}

	return value;
}

export function debox(boxed) {
	if (boxed instanceof Array) {
		const top = boxed[0];
		const ss = boxed[1];
		const fos = boxed[2];
		const ros = fos.map(fo => (fo[0] ? {} : []));
		ros.forEach((ro, i) => {
			const fo = fos[i];
			const l = fo.length;
			if (fo[0]) {
				for (let i = 1; i < l; i += 2) {
					const k = fo[i];
					const v = fo[i + 1];
					const key = k ? ss[k - 1] : k;
					const value = (v instanceof Array) ? (v[0] < 0 ? ros[-1 - v[0]] : ss[v[0] - 1]) : v;
					ro[key] = value;
				}
			} else {
				for (let i = 1; i < l; ++i) {
					const v = fo[i];
					const value = (v instanceof Array) ? (v[0] < 0 ? ros[-1 - v[0]] : ss[v[0] - 1]) : v;
					ro.push(value);
				}
			}
		});
		return (top < 0 ? ros[-1 - top] : ss[top - 1]);
	}

	return boxed;
}

export default {
	box,
	debox,
};
