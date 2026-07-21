import { useEffect, useState, useCallback } from 'react';
import * as ivFluidService from '../services/ivFluidService.js';
import { useSocket } from '../context/SocketContext.jsx';

export const useLiveIVFluids = (params) => {
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { onIVUpdate } = useSocket();

  const refresh = useCallback(() => {
    setLoading(true);
    ivFluidService
      .getIVFluids(params)
      .then(setBags)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = onIVUpdate((updated) => {
      setBags((prev) => {
        const idx = prev.findIndex((b) => b._id === updated._id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated };
        return next;
      });
    });
    return unsubscribe;
  }, [onIVUpdate]);

  return { bags, loading, error, refresh, setBags };
};

export default useLiveIVFluids;
