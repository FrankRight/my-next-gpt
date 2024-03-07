import useSWRMutation from "swr/mutation";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
const X_API_KEY = process.env.NEXT_PUBLIC_X_API_KEY;

const postForm = async (url: string, { arg }: any) => {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": X_API_KEY,
      } as any,
      body: JSON.stringify(arg),
    });

    return response.json();
  } catch (error) {
    // console.error("Error posting data:", error);
    throw error;
  }
};

const deleteData = async (url: string) => {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/${url}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": X_API_KEY,
      } as any,
    });

    return response.json();
  } catch (error) {
    throw error;
  }
};

const updateData = async (url: string, { arg }: any) => {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": X_API_KEY,
      } as any,
      body: JSON.stringify(arg),
    });

    return response.json();
  } catch (error) {
    throw error;
  }
};

const useMutation = (url: string) => {
  const { trigger, isMutating, error, data } = useSWRMutation(url, postForm);

  return { trigger, isMutating, error, data };
};

const useDeleteMutation = (url: string) => {
  const { trigger, isMutating, error, data } = useSWRMutation(url, deleteData);

  return { trigger, isMutating, error, data };
};

const useUpdateMutation = (url: string) => {
  const { trigger, isMutating, error, data } = useSWRMutation(url, updateData);

  return { trigger, isMutating, error, data };
};

export { useMutation, useDeleteMutation, useUpdateMutation };
