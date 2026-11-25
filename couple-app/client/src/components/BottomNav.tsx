import { Home, Calendar, Utensils, Gamepad2, Gift } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  shoppingBadgeCount?: number;
}

export default function BottomNav({ activeTab, onSelectTab, shoppingBadgeCount }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Dates', icon: Calendar },
    { id: 'meals', label: 'Essen', icon: Utensils },
    { id: 'quiz', label: 'Spiele', icon: Gamepad2 },
    { id: 'lists', label: 'Listen', icon: Gift, badge: shoppingBadgeCount }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full lg:max-w-5xl xl:max-w-6xl mx-auto bg-white/95 backdrop-blur-md border-t border-pink-100 flex justify-around items-center h-18 sm:h-20 z-40 px-2 sm:px-6 shadow-lg safe-bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 min-w-0 h-full relative transition-all active:scale-90 ${
              isActive ? 'text-[var(--color-primary-dark)] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="relative">
              <Icon size={25} strokeWidth={isActive ? 2.5 : 2} />
              {!!tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-pink-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-xs mt-1 tracking-tight truncate max-w-full text-center ${
                isActive ? 'font-black text-gray-900' : 'font-extrabold text-gray-400'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
