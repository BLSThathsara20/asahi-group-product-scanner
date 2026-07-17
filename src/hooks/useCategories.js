import { useState, useEffect, useCallback } from "react";
import { getCategories } from "../services/categoryService";

export function useCategories() {
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);

	const refetch = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getCategories();
			setCategories(data);
		} catch {
			setCategories([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { categories, loading, refetch };
}
