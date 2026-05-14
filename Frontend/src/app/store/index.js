/**
 * Redux Store with Dynamic Reducer Injection
 * 
 * This store configuration supports lazy-loading reducers for code splitting.
 * Only critical reducers (like auth) are loaded initially.
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '@modules/auth/store/authSlice';
import { baseApi } from '@shared/api/baseApi';

// Static reducers that are always needed
const staticReducers = {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
};

/**
 * Reducer Manager for Dynamic Injection
 * Allows adding/removing reducers at runtime for code splitting
 */
export const createReducerManager = (initialReducers) => {
    const reducers = { ...initialReducers };
    let combinedReducer = combineReducers(reducers);
    let keysToRemove = [];

    return {
        getReducerMap: () => reducers,

        reduce: (state, action) => {
            // Remove reducers that been marked for removal
            if (keysToRemove.length > 0) {
                state = { ...state };
                keysToRemove.forEach((key) => delete state[key]);
                keysToRemove = [];
            }
            return combinedReducer(state, action);
        },

        add: (key, reducer) => {
            if (!key || reducers[key]) {
                if (import.meta.env.DEV) {
                    console.warn(`Reducer "${key}" already exists or key is invalid`);
                }
                return;
            }

            reducers[key] = reducer;
            combinedReducer = combineReducers(reducers);

            if (import.meta.env.DEV) {
                console.log(`✅ Reducer "${key}" injected`);
            }
        },

        remove: (key) => {
            if (!key || !reducers[key]) return;

            delete reducers[key];
            keysToRemove.push(key);
            combinedReducer = combineReducers(reducers);

            if (import.meta.env.DEV) {
                console.log(`❌ Reducer "${key}" removed`);
            }
        },
    };
};

const reducerManager = createReducerManager(staticReducers);

/**
 * Configure Store
 */
export const store = configureStore({
    reducer: reducerManager.reduce,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types for RTK Query
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }).concat(baseApi.middleware),
    devTools: import.meta.env.DEV,
});

// Attach reducer manager to store for dynamic injection
store.reducerManager = reducerManager;

/**
 * Helper function to inject a reducer dynamically
 * @param {string} key - Reducer key name
 * @param {Function} reducer - Reducer function
 */
export const injectReducer = (key, reducer) => {
    if (store.reducerManager) {
        store.reducerManager.add(key, reducer);
    }
};

/**
 * Helper function to remove a reducer
 * @param {string} key - Reducer key name
 */
export const ejectReducer = (key) => {
    if (store.reducerManager) {
        store.reducerManager.remove(key);
    }
};

export default store;
