import { createContext, useContext, useState, useEffect } from 'react';

type AlarmContextType = {
  unacknowledgedCount: number;
  fetchAlarmCount: () => void;
  decreaseCount: () => void;
};

const AlarmContext = createContext<AlarmContextType | null>(null);

export const useAlarmContext = () => {
  const context = useContext(AlarmContext);
  if (!context) throw new Error("AlarmContext must be used within provider");
  return context;
};

export const AlarmProvider = ({ children }: { children: React.ReactNode }) => {
  const [unacknowledgedCount, setCount] = useState(0);

  const fetchAlarmCount = async () => {
    try {
      const res = await fetch('/api/alarms/?acknowledged=false');
      const data = await res.json();
      setCount(data.length);
    } catch {
      setCount(0);
    }
  };

  const decreaseCount = () => {
    setCount(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    fetchAlarmCount();
  }, []);

  return (
    <AlarmContext.Provider value={{ unacknowledgedCount, fetchAlarmCount, decreaseCount }}>
      {children}
    </AlarmContext.Provider>
  );
};
