/**
 * Typed Redux Hooks
 * 
 * Use these instead of plain `useDispatch` and `useSelector` for better type inference
 */

import { useDispatch, useSelector } from 'react-redux';

/**
 * Typed useDispatch hook
 * Use throughout your app instead of plain `useDispatch`
 */
export const useAppDispatch = () => useDispatch();

/**
 * Typed useSelector hook
 * Use throughout your app instead of plain `useSelector`
 * @example
 * const user = useAppSelector(state => state.auth.user);
 */
export const useAppSelector = useSelector;
