
import React, { useState } from 'react';
import type { Trip, Friend } from '../types';
import Modal from './Modal';
import { PlusIcon, UsersIcon } from './icons';

interface TripListScreenProps {
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  friends: Friend[];
  onSelectTrip: (tripId: string) => void;
}

const TripListScreen: React.FC<TripListScreenProps> = ({ trips, setTrips, friends, onSelectTrip }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripName, setTripName] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (tripName.trim() && tripDate && selectedFriends.length > 0) {
      const newTrip: Trip = {
        id: crypto.randomUUID(),
        name: tripName,
        date: tripDate,
        members: selectedFriends,
        expenses: [],
      };
      setTrips(prev => [...prev, newTrip]);
      setTripName('');
      setTripDate('');
      setSelectedFriends([]);
      setIsModalOpen(false);
    }
  };

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };
  
  const getFriendName = (id: string) => friends.find(f => f.id === id)?.name || 'Unknown';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Trips</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transition-transform transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No trips yet!</h3>
          <p className="text-neutral dark:text-gray-400 mt-2">Click "New Trip" to plan your next adventure.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => (
            <div
              key={trip.id}
              onClick={() => onSelectTrip(trip.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
            >
              <div className="p-5">
                <h3 className="text-xl font-bold text-primary dark:text-accent truncate">{trip.name}</h3>
                <p className="text-neutral dark:text-gray-400 text-sm mb-4">{trip.date}</p>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <UsersIcon className="w-5 h-5 mr-2 text-accent"/>
                    <span>{trip.members.length} member{trip.members.length !== 1 && 's'}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Total Expenses: <span className="font-semibold text-gray-800 dark:text-white">₹{trip.expenses.reduce((acc, exp) => acc + exp.amount, 0).toFixed(2)}</span>
                </div>
              </div>
               <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    {trip.members.slice(0, 5).map(memberId => {
                      const friend = friends.find(f => f.id === memberId);
                      if (!friend) return null;
                      return friend.photo ? (
                        <img key={memberId} src={friend.photo} alt={friend.name} title={friend.name} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover"/>
                      ) : (
                        <div key={memberId} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-primary text-white flex items-center justify-center text-xs font-bold" title={friend.name}>
                          {friend.name.charAt(0)}
                        </div>
                      )
                    })}
                    {trip.members.length > 5 && (
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs font-bold">
                        +{trip.members.length - 5}
                      </div>
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Trip">
        <form onSubmit={handleAddTrip} className="space-y-4">
          <div>
            <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trip Name</label>
            <input
              id="tripName"
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="e.g., Summer Vacation"
              required
            />
          </div>
          <div>
            <label htmlFor="tripDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input
              id="tripDate"
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Members</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md">
              {friends.length > 0 ? friends.map(friend => (
                <div key={friend.id} className="flex items-center">
                  <input
                    id={`friend-${friend.id}`}
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => handleFriendToggle(friend.id)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor={`friend-${friend.id}`} className="ml-3 block text-sm text-gray-900 dark:text-gray-100">{friend.name}</label>
                </div>
              )) : <p className="text-sm text-neutral dark:text-gray-400">No friends added yet. Please add friends from the 'Friends' tab.</p>}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400"
              disabled={!tripName.trim() || !tripDate || selectedFriends.length === 0}
            >
              Create Trip
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TripListScreen;
