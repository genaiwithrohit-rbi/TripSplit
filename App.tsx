
import React, { useState, useEffect } from 'react';
import type { Friend, Trip } from './types';
import FriendManagerScreen from './components/FriendManagerScreen';
import TripDetailScreen from './components/TripDetailScreen';
import TripListScreen from './components/TripListScreen';

type View = 'TRIPS' | 'TRIP_DETAIL' | 'FRIENDS';

const App: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentView, setCurrentView] = useState<View>('TRIPS');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    // Load data from localStorage on initial render
    const storedFriends = localStorage.getItem('tripSplitFriends');
    if (storedFriends) setFriends(JSON.parse(storedFriends));
    
    const storedTrips = localStorage.getItem('tripSplitTrips');
    if (storedTrips) setTrips(JSON.parse(storedTrips));
  }, []);

  useEffect(() => {
    // Save data to localStorage whenever it changes
    localStorage.setItem('tripSplitFriends', JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem('tripSplitTrips', JSON.stringify(trips));
  }, [trips]);


  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setCurrentView('TRIP_DETAIL');
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrips(prevTrips => prevTrips.map(trip => trip.id === updatedTrip.id ? updatedTrip : trip));
  };
  
  const handleDeleteTrip = (tripId: string) => {
    setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
    setCurrentView('TRIPS');
    setSelectedTripId(null);
  };

  const selectedTrip = trips.find(trip => trip.id === selectedTripId);

  const renderContent = () => {
    switch (currentView) {
      case 'FRIENDS':
        return <FriendManagerScreen friends={friends} setFriends={setFriends} />;
      case 'TRIP_DETAIL':
        if (selectedTrip) {
          return (
            <TripDetailScreen 
              trip={selectedTrip} 
              friends={friends} 
              onUpdateTrip={handleUpdateTrip} 
              onDeleteTrip={handleDeleteTrip}
            />
          );
        }
        // Fallback to trips list if no trip is selected
        setCurrentView('TRIPS');
        return null;
      case 'TRIPS':
      default:
        return (
          <TripListScreen
            trips={trips}
            setTrips={setTrips}
            friends={friends}
            onSelectTrip={handleSelectTrip}
          />
        );
    }
  };
  
  const NavButton: React.FC<{ view: View, label: string }> = ({ view, label }) => (
      <button 
        onClick={() => setCurrentView(view)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === view ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
      >
        {label}
      </button>
  );

  return (
    <div className="min-h-screen bg-neutral-light dark:bg-neutral-dark text-neutral-dark dark:text-neutral-light font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary dark:text-accent cursor-pointer" onClick={() => setCurrentView('TRIPS')}>
            TripSplit
          </h1>
          <nav className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
             {currentView === 'TRIP_DETAIL' && (
                <button 
                    onClick={() => setCurrentView('TRIPS')}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <ChevronLeftIcon className="w-5 h-5 mr-1" /> Back to Trips
                </button>
             )}
            <NavButton view="TRIPS" label="My Trips" />
            <NavButton view="FRIENDS" label="Friends" />
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-6">
        {renderContent()}
      </main>
    </div>
  );
};

// Define ChevronLeftIcon here to be used in App.tsx
const ChevronLeftIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);


export default App;
