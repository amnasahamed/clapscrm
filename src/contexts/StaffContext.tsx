import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { StaffMember, UserRole } from '../types';
import { MOCK_PERFORMANCE } from '../constants';
import { DEFAULT_STAFF_ROLES } from '../constants';

const STAFF_STORAGE_KEY = 'edumanage_staff_list';

interface StaffContextType {
  currentStaff: string;
  setCurrentStaff: (name: string) => void;
  staffList: StaffMember[];
  staffNames: string[];
  addStaff: (name: string, role: UserRole, pin?: string) => void;
  deleteStaff: (name: string) => void;
  updateStaffRole: (name: string, role: UserRole) => void;
  updateStaffPin: (name: string, pin: string) => void;
  getStaffMember: (name: string) => StaffMember | undefined;
}

function buildDefaultStaff(): StaffMember[] {
  return MOCK_PERFORMANCE.map(s => ({
    name: s.name,
    role: DEFAULT_STAFF_ROLES[s.name] || 'counselor',
    avatar: s.avatar,
    pin: '0000' // Default PIN for all mock staff
  }));
}

function loadStaff(): StaffMember[] {
  try {
    const stored = localStorage.getItem(STAFF_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StaffMember[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all users have at least a default pin if migrating old data
        return parsed.map(p => ({ ...p, pin: p.pin || '0000' }));
      }
    }
  } catch { /* ignore corrupt data */ }
  return buildDefaultStaff();
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: ReactNode }) {
  const [staffList, setStaffList] = useState<StaffMember[]>(loadStaff);
  const [currentStaff, setCurrentStaff] = useState(() => {
    const list = loadStaff();
    return list.length > 0 ? list[0].name : '';
  });

  useEffect(() => {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList));
  }, [staffList]);

  const staffNames = staffList.map(s => s.name);

  const addStaff = useCallback((name: string, role: UserRole = 'counselor', pin: string = '0000') => {
    setStaffList(prev => {
      if (prev.some(s => s.name === name)) return prev;
      return [...prev, {
        name,
        role,
        pin,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=18181b&color=fff`
      }];
    });
  }, []);

  const deleteStaff = useCallback((name: string) => {
    setStaffList(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(s => s.name !== name);
    });
    setCurrentStaff(prev => {
      if (prev === name) {
        const remaining = staffList.filter(s => s.name !== name);
        return remaining.length > 0 ? remaining[0].name : prev;
      }
      return prev;
    });
  }, [staffList]);

  const updateStaffRole = useCallback((name: string, role: UserRole) => {
    setStaffList(prev => prev.map(s =>
      s.name === name ? { ...s, role } : s
    ));
  }, []);

  const updateStaffPin = useCallback((name: string, pin: string) => {
    setStaffList(prev => prev.map(s =>
      s.name === name ? { ...s, pin } : s
    ));
  }, []);

  const getStaffMember = useCallback((name: string): StaffMember | undefined => {
    return staffList.find(s => s.name === name);
  }, [staffList]);

  return (
    <StaffContext.Provider value={{
      currentStaff, setCurrentStaff,
      staffList, staffNames,
      addStaff, deleteStaff, updateStaffRole, updateStaffPin, getStaffMember
    }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}
