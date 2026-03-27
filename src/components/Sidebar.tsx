import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, User, Settings, Flag, HelpCircle, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

const SidebarItem = ({ icon: Icon, label, to, active, collapsed }: { icon: any, label: string, to: string, active: boolean, collapsed: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-6 px-3 py-2.5 rounded-xl transition-colors ${
      active ? 'bg-white/10 font-medium' : 'hover:bg-white/10'
    } ${collapsed ? 'flex-col gap-1 px-1 py-4 justify-center' : ''}`}
  >
    <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-300'}`} />
    <span className={`${collapsed ? 'text-[10px]' : 'text-sm'} truncate`}>{label}</span>
  </Link>
);

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const mainItems = [
    { icon: Home, label: 'Home', to: '/' },
    { icon: Compass, label: 'Explore', to: '/explore' },
    { icon: PlaySquare, label: 'Subscriptions', to: '/subscriptions' },
  ];

  const libraryItems = [
    { icon: History, label: 'History', to: '/history' },
    { icon: PlaySquare, label: 'Your videos', to: user ? `/profile/${user.uid}` : '/login' },
    { icon: Clock, label: 'Watch later', to: '/watch-later' },
    { icon: ThumbsUp, label: 'Liked videos', to: '/liked' },
  ];

  return (
    <aside className={`fixed left-0 top-14 bottom-0 bg-[#0f0f0f] transition-all duration-300 z-40 overflow-y-auto custom-scrollbar 
      ${isOpen ? 'w-64 px-3 translate-x-0' : 'w-20 px-1 lg:translate-x-0 -translate-x-full'}
    `}>
      <div className="py-2 flex flex-col gap-1">
        {mainItems.map((item) => (
          <SidebarItem
            key={item.label}
            {...item}
            active={location.pathname === item.to}
            collapsed={!isOpen}
          />
        ))}
      </div>

      {isOpen && (
        <>
          <div className="my-3 border-t border-white/10" />
          <div className="py-2 flex flex-col gap-1">
            <h3 className="px-3 py-2 text-sm font-medium text-gray-400">Library</h3>
            {libraryItems.map((item) => (
              <SidebarItem
                key={item.label}
                {...item}
                active={location.pathname === item.to}
                collapsed={false}
              />
            ))}
          </div>
          <div className="my-3 border-t border-white/10" />
          <div className="py-2 flex flex-col gap-1">
            <h3 className="px-3 py-2 text-sm font-medium text-gray-400">Explore</h3>
            <SidebarItem icon={Settings} label="Settings" to="/settings" active={false} collapsed={false} />
            <SidebarItem icon={Flag} label="Report history" to="/report" active={false} collapsed={false} />
            <SidebarItem icon={HelpCircle} label="Help" to="/help" active={false} collapsed={false} />
            <SidebarItem icon={MessageSquare} label="Send feedback" to="/feedback" active={false} collapsed={false} />
          </div>
        </>
      )}
    </aside>
  );
}
