'use client'
import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useBots } from '@/hooks/useQueries';

// Define the bot type
interface Bot {
  id: string;
  name: string;
  status?: string;
  tags?: string[];
  [key: string]: any;
}

export default function Sidebar() {
  const { selected, changeSelected, filterByTag } = useData();
  const { data: botsData, isLoading: botsLoading } = useBots();
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cast bots data to the correct type
  const bots = botsData as Record<string, Bot> | undefined;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleBotSelect = (botId: string) => {
    const newSelected = selected.includes(botId)
      ? selected.filter(id => id !== botId)
      : [...selected, botId];
    
    changeSelected(newSelected);
  };

  // Filter bots based on search term and selected tag
  const filteredBots = bots ? Object.values(bots).filter(bot => {
    const matchesSearch = searchTerm === '' || 
      (bot.name || bot.id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !filterByTag || 
      (bot.tags && bot.tags.includes(filterByTag));
    
    return matchesSearch && matchesTag;
  }) : [];

  return (
    <aside className={`bg-gray-100 border-r border-gray-200 transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {isOpen ? (
            <>
              <h2 className="text-lg font-semibold">Bots</h2>
              <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          ) : (
            <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {isOpen && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search bots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isOpen ? (
            botsLoading ? (
              <div className="p-4 text-center text-gray-500">Loading bots...</div>
            ) : filteredBots.length > 0 ? (
              <ul className="py-2">
                {filteredBots.map((bot) => (
                  <li key={bot.id} className="px-4 py-2">
                    <button
                      onClick={() => handleBotSelect(bot.id)}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        selected.includes(bot.id)
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${bot.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="truncate">{bot.name || bot.id}</span>
                      </div>
                      {bot.tags && bot.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {bot.tags.map((tag: string) => (
                            <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-200 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">No bots found</div>
            )
          ) : (
            <div className="py-4">
              {botsLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  {filteredBots.slice(0, 5).map((bot) => (
                    <button
                      key={bot.id}
                      onClick={() => handleBotSelect(bot.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selected.includes(bot.id) ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                      title={bot.name || bot.id}
                    >
                      {(bot.name || bot.id).charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
} 