//hook to store and retrieve data from local storage
export const useLocalStorage = () => {
    const setLocalStorageItem = (key, value) => localStorage.setItem(key, value);
    const getLocalStorageItem = (key) => localStorage.getItem(key);
    return { setLocalStorageItem, getLocalStorageItem };
};