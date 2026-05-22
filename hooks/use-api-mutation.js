import { useState } from "react";

export const useApiMutation = (mutationFunction) => {
  const [pending, setPending] = useState(false);

  const mutate = async (payload) => {
    setPending(true);
    try {
      return await mutationFunction(payload);
    } finally {
      setPending(false);
    }
  };

  return { mutate, pending };
};
