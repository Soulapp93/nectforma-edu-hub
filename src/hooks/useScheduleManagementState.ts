import { useReducer, useCallback } from 'react';
import type { Schedule, ScheduleSlot } from '@/services/scheduleService';
import type { ScheduleEvent } from '@/components/schedule/EventDetailsModal';

type ViewMode = 'day' | 'week' | 'month' | 'list';

interface ScheduleManagementState {
  // Navigation
  hierarchicalView: 'selector' | 'schedule';
  allFormations: any[];
  formationsLoading: boolean;
  selectedPromotionFormation: any | null;
  // Calendar
  selectedDate: Date;
  viewMode: ViewMode;
  selectedSchedule: Schedule | null;
  slots: ScheduleSlot[];
  slotsLoading: boolean;
  isEditMode: boolean;
  isWeekNavigationOpen: boolean;
  // Modals
  isAddSlotModalOpen: boolean;
  isAddEventModalOpen: boolean;
  isEditSlotModalOpen: boolean;
  isExcelImportModalOpen: boolean;
  isDetailsModalOpen: boolean;
  // Selected items
  selectedSlot: { date: string; time: string } | null;
  slotToEdit: ScheduleSlot | null;
  detailsEvent: ScheduleEvent | null;
  // Drag & drop
  draggedSlot: ScheduleSlot | null;
  dragOverDay: string | null;
}

type Action =
  | { type: 'SET_HIERARCHICAL_VIEW'; payload: 'selector' | 'schedule' }
  | { type: 'SET_ALL_FORMATIONS'; payload: any[] }
  | { type: 'SET_FORMATIONS_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_PROMOTION_FORMATION'; payload: any | null }
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SELECTED_SCHEDULE'; payload: Schedule | null }
  | { type: 'SET_SLOTS'; payload: ScheduleSlot[] }
  | { type: 'SET_SLOTS_LOADING'; payload: boolean }
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_WEEK_NAV_OPEN'; payload: boolean }
  | { type: 'OPEN_ADD_SLOT'; payload: { date: string; time: string } }
  | { type: 'CLOSE_ADD_SLOT' }
  | { type: 'OPEN_ADD_EVENT' }
  | { type: 'CLOSE_ADD_EVENT' }
  | { type: 'OPEN_EDIT_SLOT'; payload: ScheduleSlot }
  | { type: 'CLOSE_EDIT_SLOT' }
  | { type: 'OPEN_EXCEL_IMPORT' }
  | { type: 'CLOSE_EXCEL_IMPORT' }
  | { type: 'OPEN_DETAILS'; payload: ScheduleEvent }
  | { type: 'CLOSE_DETAILS' }
  | { type: 'SET_DRAGGED_SLOT'; payload: ScheduleSlot | null }
  | { type: 'SET_DRAG_OVER_DAY'; payload: string | null };

const initialState: ScheduleManagementState = {
  hierarchicalView: 'selector',
  allFormations: [],
  formationsLoading: true,
  selectedPromotionFormation: null,
  selectedDate: new Date(),
  viewMode: 'week',
  selectedSchedule: null,
  slots: [],
  slotsLoading: false,
  isEditMode: false,
  isWeekNavigationOpen: true,
  isAddSlotModalOpen: false,
  isAddEventModalOpen: false,
  isEditSlotModalOpen: false,
  isExcelImportModalOpen: false,
  isDetailsModalOpen: false,
  selectedSlot: null,
  slotToEdit: null,
  detailsEvent: null,
  draggedSlot: null,
  dragOverDay: null,
};

function reducer(state: ScheduleManagementState, action: Action): ScheduleManagementState {
  switch (action.type) {
    case 'SET_HIERARCHICAL_VIEW': return { ...state, hierarchicalView: action.payload };
    case 'SET_ALL_FORMATIONS': return { ...state, allFormations: action.payload };
    case 'SET_FORMATIONS_LOADING': return { ...state, formationsLoading: action.payload };
    case 'SET_SELECTED_PROMOTION_FORMATION': return { ...state, selectedPromotionFormation: action.payload };
    case 'SET_SELECTED_DATE': return { ...state, selectedDate: action.payload };
    case 'SET_VIEW_MODE': return { ...state, viewMode: action.payload };
    case 'SET_SELECTED_SCHEDULE': return { ...state, selectedSchedule: action.payload };
    case 'SET_SLOTS': return { ...state, slots: action.payload };
    case 'SET_SLOTS_LOADING': return { ...state, slotsLoading: action.payload };
    case 'SET_EDIT_MODE': return { ...state, isEditMode: action.payload };
    case 'SET_WEEK_NAV_OPEN': return { ...state, isWeekNavigationOpen: action.payload };
    case 'OPEN_ADD_SLOT': return { ...state, isAddSlotModalOpen: true, selectedSlot: action.payload };
    case 'CLOSE_ADD_SLOT': return { ...state, isAddSlotModalOpen: false, selectedSlot: null };
    case 'OPEN_ADD_EVENT': return { ...state, isAddEventModalOpen: true };
    case 'CLOSE_ADD_EVENT': return { ...state, isAddEventModalOpen: false };
    case 'OPEN_EDIT_SLOT': return { ...state, isEditSlotModalOpen: true, slotToEdit: action.payload };
    case 'CLOSE_EDIT_SLOT': return { ...state, isEditSlotModalOpen: false, slotToEdit: null };
    case 'OPEN_EXCEL_IMPORT': return { ...state, isExcelImportModalOpen: true };
    case 'CLOSE_EXCEL_IMPORT': return { ...state, isExcelImportModalOpen: false };
    case 'OPEN_DETAILS': return { ...state, isDetailsModalOpen: true, detailsEvent: action.payload };
    case 'CLOSE_DETAILS': return { ...state, isDetailsModalOpen: false, detailsEvent: null };
    case 'SET_DRAGGED_SLOT': return { ...state, draggedSlot: action.payload };
    case 'SET_DRAG_OVER_DAY': return { ...state, dragOverDay: action.payload };
    default: return state;
  }
}

export function useScheduleManagementState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Convenience setters that mirror the old useState API
  const setHierarchicalView = useCallback((v: 'selector' | 'schedule') => dispatch({ type: 'SET_HIERARCHICAL_VIEW', payload: v }), []);
  const setAllFormations = useCallback((v: any[]) => dispatch({ type: 'SET_ALL_FORMATIONS', payload: v }), []);
  const setFormationsLoading = useCallback((v: boolean) => dispatch({ type: 'SET_FORMATIONS_LOADING', payload: v }), []);
  const setSelectedPromotionFormation = useCallback((v: any | null) => dispatch({ type: 'SET_SELECTED_PROMOTION_FORMATION', payload: v }), []);
  const setSelectedDate = useCallback((v: Date) => dispatch({ type: 'SET_SELECTED_DATE', payload: v }), []);
  const setViewMode = useCallback((v: ViewMode) => dispatch({ type: 'SET_VIEW_MODE', payload: v }), []);
  const setSelectedSchedule = useCallback((v: Schedule | null) => dispatch({ type: 'SET_SELECTED_SCHEDULE', payload: v }), []);
  const setSlots = useCallback((v: ScheduleSlot[]) => dispatch({ type: 'SET_SLOTS', payload: v }), []);
  const setSlotsLoading = useCallback((v: boolean) => dispatch({ type: 'SET_SLOTS_LOADING', payload: v }), []);
  const setIsEditMode = useCallback((v: boolean) => dispatch({ type: 'SET_EDIT_MODE', payload: v }), []);
  const setIsWeekNavigationOpen = useCallback((v: boolean) => dispatch({ type: 'SET_WEEK_NAV_OPEN', payload: v }), []);
  const openAddSlot = useCallback((slot: { date: string; time: string }) => dispatch({ type: 'OPEN_ADD_SLOT', payload: slot }), []);
  const closeAddSlot = useCallback(() => dispatch({ type: 'CLOSE_ADD_SLOT' }), []);
  const setIsAddEventModalOpen = useCallback((v: boolean) => dispatch({ type: v ? 'OPEN_ADD_EVENT' : 'CLOSE_ADD_EVENT' }), []);
  const openEditSlot = useCallback((slot: ScheduleSlot) => dispatch({ type: 'OPEN_EDIT_SLOT', payload: slot }), []);
  const closeEditSlot = useCallback(() => dispatch({ type: 'CLOSE_EDIT_SLOT' }), []);
  const setIsExcelImportModalOpen = useCallback((v: boolean) => dispatch({ type: v ? 'OPEN_EXCEL_IMPORT' : 'CLOSE_EXCEL_IMPORT' }), []);
  const openDetails = useCallback((event: ScheduleEvent) => dispatch({ type: 'OPEN_DETAILS', payload: event }), []);
  const closeDetails = useCallback(() => dispatch({ type: 'CLOSE_DETAILS' }), []);
  const setDraggedSlot = useCallback((v: ScheduleSlot | null) => dispatch({ type: 'SET_DRAGGED_SLOT', payload: v }), []);
  const setDragOverDay = useCallback((v: string | null) => dispatch({ type: 'SET_DRAG_OVER_DAY', payload: v }), []);

  return {
    ...state,
    dispatch,
    setHierarchicalView,
    setAllFormations,
    setFormationsLoading,
    setSelectedPromotionFormation,
    setSelectedDate,
    setViewMode,
    setSelectedSchedule,
    setSlots,
    setSlotsLoading,
    setIsEditMode,
    setIsWeekNavigationOpen,
    openAddSlot,
    closeAddSlot,
    setIsAddEventModalOpen,
    openEditSlot,
    closeEditSlot,
    setIsExcelImportModalOpen,
    openDetails,
    closeDetails,
    setDraggedSlot,
    setDragOverDay,
  };
}
